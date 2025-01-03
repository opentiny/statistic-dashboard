import { Octokit } from 'octokit'
import fs from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const octokit = new Octokit({
  auth: process.env.TOKEN
})

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

const getIssues = ({ owner, repo }) =>
  octokit
    .request('GET /repos/{owner}/{repo}/issues', {
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
      org: 'opentiny'
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
      item.issuesNum = allIssuesNum - item.pullsNum
  })
  const contributorsNumArr = await getAllRepoContributors({ owner, repos })
  // 统计contributors数量
  allData.forEach((item, index) => {
    const contributorsNum = contributorsNumArr[index]
    item.contributorsNum = contributorsNum
  })

  return allData
}
