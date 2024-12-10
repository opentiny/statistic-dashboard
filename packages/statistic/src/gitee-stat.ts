import fs from 'fs-extra';

const TOKEN = process.env.GITEE_TOKEN


const getContributors = async ({ owner, repo }) => {
    const data = await fetch(`https://gitee.com/api/v5/repos/${owner}/${repo}/contributors?access_token=${TOKEN}&type=authors`, {
        // 贡献者需要指定一下接受类型，否则会返回html
        headers: {
            accept: "application/json",
        }
    }).then( res => {
        return res.json()
    } )
    return data.length
}

const getAllRepoContributors= async ({ owner, repos }) => {
    const promises = repos.map(repo => getContributors({ owner, repo }))
    return Promise.all(promises)
} 

const getIssues = async ({ owner, repo }) => {
    const total = await fetch(`https://gitee.com/api/v5/repos/${owner}/${repo}/issues?access_token=${TOKEN}&state=all&sort=created&direction=desc&page=1&per_page=20`).then(res => res.headers.get("total_count"))
    return Number(total) || 0
}

const getAllRepoIssues = async ({ owner, repos }) => {
    const promises = repos.map(repo => getIssues({ owner, repo }))
    return Promise.all(promises)
} 

const getPulls = async ({ owner, repo }) => {
    const total = await fetch(`https://gitee.com/api/v5/repos/${owner}/${repo}/pulls?access_token=${TOKEN}&state=all&sort=created&direction=desc&page=1&per_page=20`).then(res => res.headers.get("total_count"))
    return Number(total) || 0
}

const getAllRepoPulls = async ({ owner, repos }) => {
    const promises = repos.map(repo => getPulls({ owner, repo }))
    return Promise.all(promises)
} 

const getReposInfo = async () => {
    const allReposInfo =  await fetch(`https://gitee.com/api/v5/orgs/opentiny/repos?access_token=${TOKEN}&type=all&page=1&per_page=20`).then(res => res.json())
    return allReposInfo.map(item => {
        const { name, stargazers_count: stars, forks_count: forks, created_at } = item
        return {
            name: name.trim(),
            stars,
            forks,
            created_at
        }

    }) || []
}

export const getGiteeData = async () => {
    const owner = 'opentiny'
    // const repos = ['tiny-vue', 'tiny-ng', 'tiny-engine', 'tiny-cli']
    const allData = await getReposInfo()
    const repos = allData.map(i => i.name)
    const issuesNumArr = await getAllRepoIssues({ owner, repos })
    // 统计issue数量
    allData.forEach((item, index) => {
        const issuesNum = issuesNumArr[index]
        item.issuesNum = issuesNum
    })
    const pullsNumArr = await getAllRepoPulls({ owner, repos })
    // 统计pr数量
    allData.forEach((item, index) => {
        const pullsNum = pullsNumArr[index]
        item.pullsNum = pullsNum
    })
    const contributorsNumArr = await getAllRepoContributors({ owner, repos })
    // 统计contributors数量
    allData.forEach((item, index) => {
        const contributorsNum = contributorsNumArr[index]
        item.contributorsNum = contributorsNum
    })

    return allData

}

