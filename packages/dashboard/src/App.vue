<script setup>
import DataStat from './components/DataStat.vue'
import ConfigProvider from '@opentiny/vue-config-provider'
import designSmbConfig from '@opentiny/vue-design-smb'
</script>

<template>
  <config-provider :design="designSmbConfig">
    <DataStat msg="Vite + Vue" />
  </config-provider>
</template>
