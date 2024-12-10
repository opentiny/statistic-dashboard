<template>
    <h2>GitHub统计信息</h2>
    <tiny-grid :data="githubStat">
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="项目名称"></tiny-grid-column>
      <tiny-grid-column field="stars" title="stars数"></tiny-grid-column>
      <tiny-grid-column field="forks" title="forks数"></tiny-grid-column>
      <tiny-grid-column field="issuesNum" title="issues数"></tiny-grid-column>
      <tiny-grid-column field="pullsNum" title="PR数"></tiny-grid-column>
      <tiny-grid-column field="contributorsNum" title="贡献者数量"></tiny-grid-column>
    </tiny-grid>

    <h2>GitHub贡献者8月份统计信息</h2>
    <tiny-grid :data="githubContributors" max-height="800px">
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="githubID"></tiny-grid-column>
      <tiny-grid-column field="pr" title="PR数"></tiny-grid-column>
      <tiny-grid-column field="prReview" title="review数"></tiny-grid-column>
      <tiny-grid-column field="issue" title="创建issue数"></tiny-grid-column>
      <tiny-grid-column field="issueComment" title="回复issue数"></tiny-grid-column>
      <tiny-grid-column field="discussion" title="创建discussion数"></tiny-grid-column>
    </tiny-grid>

    <h2>Gitee统计信息</h2>
    <tiny-grid :data="giteeStat">
      <tiny-grid-column field="name" title="项目名称"></tiny-grid-column>
      <tiny-grid-column field="stars" title="stars数"></tiny-grid-column>
      <tiny-grid-column field="forks" title="forks数"></tiny-grid-column>
      <tiny-grid-column field="issuesNum" title="issues数"></tiny-grid-column>
      <tiny-grid-column field="pullsNum" title="PR数"></tiny-grid-column>
      <tiny-grid-column field="contributorsNum" title="贡献者数量"></tiny-grid-column>
    </tiny-grid>
  </template>
  
  <script setup lang="jsx">
  import TinyGrid from '@opentiny/vue-grid'
  import TinyGridColumn from '@opentiny/vue-grid-column'
  import { ref, onMounted } from 'vue'
  
  const githubStat = ref([])
  const githubContributors = ref([])
  const giteeStat = ref([])

  onMounted(() => {
    fetch(`${import.meta.env.BASE_URL}test.json`).then(res => res.json()).then(data => {
        const { giteeData, githubData } = data
        githubStat.value = giteeData
        githubContributors.value = Object.entries(githubData).map(([name, value]) => ({ name, ...value }))
        giteeStat.value = giteeData
    })
  })
  
  </script>
  