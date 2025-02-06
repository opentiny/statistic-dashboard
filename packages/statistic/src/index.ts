import fs from 'fs-extra';
import { getGiteeOverview } from './gitee-overview.ts' 
import { getAllRepoScore } from './github-stat.ts'
import { getGithubOverview } from './github-overview.ts'



const getAllData = async () => {
   const month = 01
   const year = 2025
   const githubOverview = getGithubOverview()
   const giteePromise = getGiteeOverview()
   const githubPromise = getAllRepoScore({ month, year })
   Promise.all([githubOverview, giteePromise, githubPromise]).then(res => {
    const [githubOverviewData, giteeData, githubData] = res
    const allData = { month, gitee: { overview: giteeData }, github: { contributorsData: githubData, overview: githubOverviewData  } }
    fs.writeFileSync('../dashboard/public/stat.json', JSON.stringify(allData, null, 2) + '\n')
   })

}


getAllData()