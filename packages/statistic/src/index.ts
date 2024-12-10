import fs from 'fs-extra';
import { getGiteeData } from './gitee-stat.ts' 
import { getAllRepoScore } from './github-stat.ts'



const getAllData = async () => {

   const giteePromise = getGiteeData()
   const githubPromise = getAllRepoScore()
   Promise.all([giteePromise, githubPromise]).then(res => {
    const [giteeData, githubData] = res
    console.log('githubData', githubData)
    const allData = { giteeData: { overview: giteeData }, githubData: { contributorsData: githubData, overview: giteeData  } }
    fs.writeFileSync('./test.json', JSON.stringify(allData, null, 2) + '\n')
   })

}


getAllData()