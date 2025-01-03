<template>
    <h2>github统计信息</h2>
    <tiny-grid :data="githubStat" show-footer :footer-method="footerMethod" max-height="500px" >
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="项目名称"></tiny-grid-column>
      <tiny-grid-column field="stars" title="stars数" sortable></tiny-grid-column>
      <tiny-grid-column field="forks" title="forks数" sortable></tiny-grid-column>
      <tiny-grid-column field="issuesNum" title="issues数" sortable></tiny-grid-column>
      <tiny-grid-column field="pullsNum" title="PR数" sortable></tiny-grid-column>
      <tiny-grid-column field="contributorsNum" title="贡献者数量" sortable></tiny-grid-column>
    </tiny-grid>

    <h2>TinyVue贡献者{{month}}月份github统计信息</h2>
    <tiny-grid :data="githubContributors" max-height="500px">
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="githubID"></tiny-grid-column>
      <tiny-grid-column field="prScore" title="PR得分" sortable></tiny-grid-column>
      <tiny-grid-column field="reviewScore" title="review得分" sortable></tiny-grid-column>
      <tiny-grid-column field="issueScore" title="issue得分" sortable></tiny-grid-column>
      <tiny-grid-column field="issueCommentScore" title="回复issue得分" sortable></tiny-grid-column>
      <tiny-grid-column field="discussionScore" title="discussion得分" sortable></tiny-grid-column>
      <tiny-grid-column field="all" title="总得分" sortable></tiny-grid-column>
    </tiny-grid>

    <h2>Gitee统计信息</h2>
    <tiny-grid :data="giteeStat" show-footer :footer-method="footerMethod" max-height="500px">
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="项目名称"></tiny-grid-column>
      <tiny-grid-column field="stars" title="stars数" sortable></tiny-grid-column>
      <tiny-grid-column field="forks" title="forks数" sortable></tiny-grid-column>
      <tiny-grid-column field="issuesNum" title="issues数" sortable></tiny-grid-column>
      <tiny-grid-column field="pullsNum" title="PR数" sortable></tiny-grid-column>
      <tiny-grid-column field="contributorsNum" title="贡献者数量" sortable></tiny-grid-column>
    </tiny-grid>
  </template>
  
  <script setup lang="jsx">
  import TinyGrid from '@opentiny/vue-grid'
  import TinyGridColumn from '@opentiny/vue-grid-column'
  import { ref, onMounted } from 'vue'
  
  const githubStat = ref([])
  const githubContributors = ref([])
  const giteeStat = ref([])
  const month = ref(new Date().getMonth())

  const footerMethod = ({ columns, data }) => {

      return [
        columns.map((column, columnIndex) => {
          if (columnIndex === 0) {
            return '总计'
          }

          if (columnIndex > 1) {
            return data.map((item) => item[column.property]).reduce((acc, item) => acc + item)
          }

          return null
        }),
      ]
    }

  onMounted(() => {
    fetch(`${import.meta.env.BASE_URL}stat.json`).then(res => res.json()).then(data => {
        const { gitee, github } = data
        githubStat.value = github.overview.sort((a, b) => b.stars - a.stars)
        githubContributors.value = Object.entries(github.contributorsData).map(([name, value]) => {

          const all = value.prScore + value.reviewScore + value.issueScore + value.issueCommentScore + value.discussionScore
          return { name, ...value, all }
        })
        giteeStat.value = gitee.overview.sort((a, b) => b.stars - a.stars)
        month.value = data.month
    })
  })
  
  </script>
  