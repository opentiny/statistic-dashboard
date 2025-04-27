import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Octokit } from 'octokit'
import fs from 'fs-extra'
import { GraphQLClient, gql } from 'graphql-request'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const octokit = new Octokit({
  auth: process.env.TOKEN
})

async function getTotalIssuesCount(owner, repo) {
  const endpoint = 'https://api.github.com/graphql'
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`
    }
  })

  const query = gql`
    query ($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        issues {
          totalCount
        }
      }
    }
  `

  const variables = {
    owner,
    name: repo
  }

  try {
    const data = await graphQLClient.request(query, variables)
    return data.repository.issues.totalCount
  } catch (error) {
    throw new Error(`GraphQL query failed: ${error.message}`)
  }
}

// 示例使用
;(async () => {
  // 替换为你的 GitHub Personal Access Token
  const GITHUB_TOKEN = 'your_personal_access_token'
  // 替换为目标仓库的 owner 和 repo 名称
  const OWNER = 'octocat'
  const REPO = 'Hello-World'

  try {
    const totalIssues = await getTotalIssuesCount(OWNER, REPO, GITHUB_TOKEN)
    console.log(`Total number of issues in ${OWNER}/${REPO}: ${totalIssues}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
})()

const getTotalNum = (res) => {
  const linkStr = res.headers.link
  if (linkStr) {
    const lastLink = linkStr.split(',')[1]
    const len = Number(lastLink.match(/page=([\d]+)&/)[1])
    return len
  }
  return res.data?.length || 0
}

const getContributors = ({ owner, repo }) =>
  octokit
    .request('GET /repos/{owner}/{repo}/contributors', {
      owner,
      repo,
      page: 1,
      per_page: 1,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    .then((res) => {
      return getTotalNum(res)
    })

const getAllRepoContributors = async ({ owner, repos }) => {
  const promises = repos.map((repo) => getContributors({ owner, repo }))
  return Promise.all(promises)
}

const getPulls = ({ owner, repo }) =>
  octokit
    .request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      state: 'all',
      page: 1,
      per_page: 1,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    .then((res) => getTotalNum(res))

const getIssues = ({ owner, repo }) => getTotalIssuesCount(owner, repo)

const getAllRepoPulls = async ({ owner, repos }) => {
  const promises = repos.map((repo) => getPulls({ owner, repo }))
  return Promise.all(promises)
}

const getAllRepoIssues = async ({ owner, repos }) => {
  const promises = repos.map((repo) => getIssues({ owner, repo }))
  return Promise.all(promises)
}

const getReposInfo = async () => {
  const allReposInfo = await octokit
    .request('GET /orgs/{org}/repos', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
      org: 'opentiny',
      per_page: 100
    })
    .then((res) => {
      return (
        res.data?.map((item) => ({
          name: item.name.trim(),
          stars: item.stargazers_count,
          forks: item.forks
        })) || []
      )
    })
    .catch((err) => {
      console.error(err)
    })

  return allReposInfo
}

export const getGithubOverview = async () => {
  const owner = 'opentiny'
  const allData = await getReposInfo()
  const repos = allData.map((i) => i.name)
  const pullsNumArr = await getAllRepoPulls({ owner, repos })
  const issuesNumArr = await getAllRepoIssues({ owner, repos })
  // 统计pr数量
  allData.forEach((item, index) => {
    const pullsNum = pullsNumArr[index]
    item.pullsNum = pullsNum
  })
  // 统计issues数量
  allData.forEach((item, index) => {
    const allIssuesNum = issuesNumArr[index]
    item.issuesNum = allIssuesNum
  })
  const contributorsNumArr = await getAllRepoContributors({ owner, repos })
  // 统计contributors数量
  allData.forEach((item, index) => {
    const contributorsNum = contributorsNumArr[index]
    item.contributorsNum = contributorsNum
  })

  return allData
}
