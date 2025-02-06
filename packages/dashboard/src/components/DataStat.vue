<template>
  <div class="grid-title-box">
    <h2>github统计信息</h2>
    <tiny-button @click="doExport('1')">导出</tiny-button>
  </div>
    <tiny-grid ref="gridRef1" :data="githubStat" show-footer :footer-method="footerMethod" max-height="500px" >
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="项目名称"></tiny-grid-column>
      <tiny-grid-column field="stars" title="stars数" sortable></tiny-grid-column>
      <tiny-grid-column field="forks" title="forks数" sortable></tiny-grid-column>
      <tiny-grid-column field="issuesNum" title="issues数" sortable></tiny-grid-column>
      <tiny-grid-column field="pullsNum" title="PR数" sortable></tiny-grid-column>
      <tiny-grid-column field="contributorsNum" title="贡献者数量" sortable></tiny-grid-column>
    </tiny-grid>

    <div class="grid-title-box">
      <h2>TinyVue贡献者{{month}}月份github统计信息</h2>
      <tiny-button @click="doExport('2')">导出</tiny-button>
    </div>
    <tiny-grid ref="gridRef2" :data="githubContributors" max-height="500px">
      <tiny-grid-column type="index" width="60"></tiny-grid-column>
      <tiny-grid-column field="name" title="githubID"></tiny-grid-column>
      <tiny-grid-column field="prScore" title="PR得分" sortable></tiny-grid-column>
      <tiny-grid-column field="reviewScore" title="review得分" sortable></tiny-grid-column>
      <tiny-grid-column field="issueScore" title="issue得分" sortable></tiny-grid-column>
      <tiny-grid-column field="issueCommentScore" title="回复issue得分" sortable></tiny-grid-column>
      <tiny-grid-column field="discussionScore" title="discussion得分" sortable></tiny-grid-column>
      <tiny-grid-column field="all" title="总得分" sortable></tiny-grid-column>
    </tiny-grid>

    <div class="grid-title-box">
      <h2>Gitee统计信息</h2>
      <tiny-button @click="doExport('3')">导出</tiny-button>
    </div>
    <tiny-grid ref="gridRef3" :data="giteeStat" show-footer :footer-method="footerMethod" max-height="500px">
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
  import TinyButton from '@opentiny/vue-button'
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

const gridRef1 = ref()
const gridRef2 = ref()
const gridRef3 = ref()
const doExport = (gridName) => {
  let gridRef
  let filename
  let data
  if (gridName === '1') {
    gridRef = gridRef1
    filename = 'github统计信息.csv'
    data = githubStat.value
  }
  if (gridName === '2') {
    gridRef = gridRef2
    filename = '贡献者信息.csv'
    data = githubContributors.value
  }
  if (gridName === '3') {
    gridRef = gridRef3
    filename = 'Gitee统计信息.csv'
    data = giteeStat.value
  }
  gridRef.value.exportCsv({
        // 文件名称
        filename,
        original: true,
        // 是否导出表头
        isHeader: true,
        // 是否在每行后面添加制表符
        useTabs: false,
        // 导出的数据
        data
      })

}

  onMounted(() => {
    fetch(`${import.meta.env.BASE_URL}stat.json?timestamp=${new Date()}`).then(res => res.json()).then(data => {
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

<style scoped>

.grid-title-box {
  position: relative;
}

.grid-title-box :deep(button) {
  position: absolute;
  right: 0;
  top: 5px;
}
</style>
  