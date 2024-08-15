import { Octokit } from 'octokit'
import fs from 'fs-extra';
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const octokit = new Octokit({
  auth: process.env.TOKEN
})

const initScore = () => ({
  pr: 0,
  prReview: 0,
  issue: 0,
  issueComment: 0,
  discussion: 0,
})

const scoreMap = {}

const judgeFinish = ({data, pageSize, year, month}) => {
  const lastData = data[data.length - 1]
  const dataMonth = parseFloat(lastData.created_at.split('-')[1])
  const dataYear = parseFloat(lastData.created_at.split('-')[0])
  if (data.length < pageSize || (dataYear < year || dataMonth < month)) {
    return true
  } 
  return false
}

// pr也是issues一种，区别是issue是没有pull_request字段
const getIssuesData = async ({ owner, repo, year, month }) => {
  let isFinish = false
  let page = 1
  let issuesData = []
  const pageSize = 100
  while (!isFinish) {
    await octokit
      .request('GET /repos/{owner}/{repo}/issues', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
        state: 'all',
        owner,
        repo,
        per_page: pageSize,
        page
      })
      .then((res) => {
        const data = res.data
        if (data.length === 0) {
          isFinish = true
          return 
        }

        issuesData = issuesData.concat(data)
        page++
        isFinish = judgeFinish({ data, pageSize, year, month })
      })
      .catch((err) => {
        console.error(err)
        isFinish = true
      })
  }
  return issuesData
}

const getDiscussionData = async ({ owner, repo, year, month }) => {
  let isFinish = false
  let page = 1
  let discussionData = []
  const pageSize = 100
  while (!isFinish) {
    await octokit
      .request('GET /repos/{owner}/{repo}/discussions', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
        owner,
        repo,
        per_page: pageSize,
        page
      })
      .then((res) => {
        const data = res.data
        if (data.length === 0) {
          isFinish = true
          return 
        }

        discussionData = discussionData.concat(data)
        page++
        // isFinish = judgeFinish({ data, pageSize, year, month })
        isFinish = true
      })
      .catch((err) => {
        console.error(err)
        isFinish = true
      })
  }
  return discussionData
}

const getIssuesComments = async ({ owner, repo, year, month }) => {
  let isFinish = false
  let page = 1
  let commentsData = []
  const pageSize = 100
  while (!isFinish) {
    await octokit
      .request('GET /repos/{owner}/{repo}/issues/comments', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
        owner,
        repo,
        per_page: pageSize,
        page,
        direction: 'desc'
      })
      .then((res) => {
        const data = res.data
        if (data.length === 0) {
          isFinish = true
          return 
        }

        commentsData = commentsData.concat(data)
        page++
        isFinish = judgeFinish({ data, pageSize, year, month })
        isFinish = true
      })
      .catch((err) => {
        console.error(err)
        isFinish = true
      })
  }
  return commentsData
}

const getPrsComments = async ({ owner, repo, year, month }) => {
  let isFinish = false
  let page = 1
  let commentsData = []
  const pageSize = 100
  while (!isFinish) {
    await octokit
      .request('GET /repos/{owner}/{repo}/pulls/comments', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        },
        owner,
        repo,
        per_page: pageSize,
        page,
        sort: 'created_at',
        direction: 'desc'
      })
      .then((res) => {
        const data = res.data
        if (data.length === 0) {
          isFinish = true
          return 
        }

        commentsData = commentsData.concat(data)
        page++
        isFinish = judgeFinish({ data, pageSize, year, month })
        isFinish = true
      })
      .catch((err) => {
        console.error(err)
        isFinish = true
      })
  }
  return commentsData
}

// 获取所有的原始信息用于统计
const getAllData = async ({ owner, repo, year, month }) => {
  const allData = {
    issues: [],
    prs: [],
    issuesComments: [],
    prsComments: [],
  }

  const useCache = true
  const filePath = path.join(__dirname, `./${repo}-data.json`)
  let cacheData
  // 将数据写入本地，方便调试
  if (useCache && fs.existsSync(filePath)) {
    cacheData = await import(`./${repo}-data.json`).then(res => res).catch(() => null)
    if (cacheData) {
      console.log('使用静态缓存数据计算')
      return cacheData
    }
  }
  const issuesData = await getIssuesData({ owner, repo, year, month })
  // issue是没有pull_request字段
  const issues = issuesData.filter(i => !i.pull_request) || []
  // 过滤已合入的PR
  const prs = issuesData.filter(i => i.pull_request?.merged_at && i.closed_at) || []
  allData.issues = issues
  allData.prs = prs

  const issuesComments = await getIssuesComments({ owner, repo, year, month })
  allData.issuesComments = issuesComments
  const prsComments = await getPrsComments({ owner, repo, year, month })
  allData.prsComments = prsComments
  if (useCache && !cacheData) {
    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2) + '\n')
  }
  return allData
}


// 判断时间是否是有效时间
const isValidateTime = ({ key = 'create_at', item }) => {
  return true
}

const statScore = ({scoreMap, type, name, score}) => {
  if (Object.prototype.hasOwnProperty.call(scoreMap, name)) {
    scoreMap[name][type] += score
  } else {
    scoreMap[name] = initScore()
    scoreMap[name][type] = score
  }
}

const statPrScore = ({ data, month, year, scoreMap }) => {
  // 根据pr打的标签来给分，以最高分标签最准
  const labelScore = {
    enhancement: 2
  }
  data.filter(item => isValidateTime({ item })).forEach(item => {
    const { labels } = item
    const scoreArr = labels.map(label => labelScore[label.name] || 1)
    // 没有打标签的情况下，默认给个一分
    scoreArr.push(1)
    const score = Math.max.apply(null, scoreArr)
    const name = item.user.login
    statScore({ scoreMap, type: 'pr', name, score  })
  })
}

const statIssueScore = ({ data, month, year, scoreMap }) => {
  data.filter(item => isValidateTime({ item })).forEach(item => {
    const name = item.user.login
    statScore({ scoreMap, type: 'issue', name, score: 1  })
  })
}

const statReviewScore = ({ data, month, year, scoreMap }) => {
  data.filter(item => isValidateTime({ item })).forEach(item => {
    const name = item.user.login
    statScore({ scoreMap, type: 'prReview', name, score: 1  })
  })
}

const statCommentScore = ({ data, month, year, scoreMap, issues }) => {
  // 记录issue相关人员，避免重复计分
  const issueMap = {}
  issues.forEach(item => {
    const { number, user } = item
    issueMap[number] = [user.login]
  })

  data.filter(item => isValidateTime({ item })).forEach(item => {
    const { number, user, issue_url: url } = item
    const name = item.user.login
    const arr = url.split('/')
    const issueId = arr[arr.length - 1]
    if (issueMap[issueId]) {
      if (!issueMap[issueId].includes(name)) {
        statScore({ scoreMap, type: 'issueComment', name, score: 1  })
        issueMap[issueId].push(name)
      } 
    } else {
      issueMap[issueId] = [name]
    }
  })
}

const getAllScore = async ({ month, year, owner, repo }) => {

  const {issues, prs, issuesComments, prsComments} = await getAllData({ owner, repo, month, year })
  const scoreMap = {}
  statPrScore({ data: prs, month, year, scoreMap })
  statIssueScore({ data: issues, month, year, scoreMap })
  statReviewScore({ data: prsComments, month, year, scoreMap })
  statCommentScore({ data: issuesComments, month, year, scoreMap, issues })
  console.log(scoreMap)
  return scoreMap
}

const getAllRepoScore = () => {
  const month = 8
  const year = 2024
  const owner = 'opentiny'
  const repo = 'tiny-vue'
  const map = getAllScore({ month, year, owner, repo })
  
}


getAllRepoScore()
