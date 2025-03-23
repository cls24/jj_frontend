<template>

  <div class="dashboard-container">
    <el-row style="background:#fff;padding:16px 16px 0;margin-bottom:32px;">
      <line-chart :chart-data="lineChartData" />
    </el-row>
    <component :is="currentRole" />
  </div>

</template>

<script>
import { mapGetters } from 'vuex'
import adminDashboard from './admin'
import editorDashboard from './editor'
import axios from "axios";
import {host} from "@/settings";
import {formatDate} from "@/utils";
import LineChart from "@/views/dashboard/admin/components/LineChart.vue";
export default {
  name: 'Dashboard',
  components: {LineChart, adminDashboard },
  // components: { adminDashboard, editorDashboard },
  data() {
    return {
      lineChartData: null,
      currentRole: 'adminDashboard'
    }
  },
  computed: {
    ...mapGetters([
      'roles'
    ])
  },
  beforeMount() {
    console.log('created')
    // this.test()
    var date = formatDate()
    axios.get(host + 'outBoundList/date/'+date+'/'+date ).then((res) => {
      if (res.status === 200 && res.data != null) {
        console.log(res.data.data)
      }else {
      }
    })
  }
}
</script>
