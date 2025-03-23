<template>
  <div class="app-container">
    <upload-excel-component :on-success="handleSuccess" :before-upload="beforeUpload" />
    <button @click="clickaddshopingcart" >批量添加购物车

     <el-main v-loading="Loading" element-loading-background="rgba(0, 0, 0, 0)"
        element-loading-text="添加中..."
        element-loading-spinner="el-icon-loading">
      </el-main>
    </button>
<!--    <TEXT v-bind:totalprice>总金额：{{totalprice}}</TEXT>-->
<el-input v-model="totalprice" placeholder=""></el-input>
<el-input v-model="totalcount" placeholder=""></el-input>
<el-input v-model="_totalcount" placeholder=""></el-input>

    <el-table :Key="key" :data="tableData"  border highlight-current-row style="width: 100%;margin-top:20px;" :cell-style="columnStyle" >
      <el-table-column v-for="item of tableHeader" :key="item" :prop="item" :label="item" />
    </el-table>
<!--    <el-table :data="res" border highlight-current-row style="width: 100%;margin-top:20px;">-->
<!--      <el-table-column v-for="item of tableHeader" :key="item" :prop="item" :label="item" />-->
<!--    </el-table>-->

  </div>
</template>

<script>
import UploadExcelComponent from '@/components/UploadExcel/index.vue'
import {addshopingcart} from "@/api/ninebot_dms";
import axios from 'axios';
import {host} from "@/settings";
import startLoading from "@/utils/loading";
let loading;
export default {
  name: 'AddShoppingCart',
  components: { UploadExcelComponent },
  data() {
    return {
      tableData: [],
      tableHeader: [],
      res: {},
      Loading:false,
      isShow:false,
      key:0,
      totalprice:0,
      totalcount:0,
      _totalcount:0
    }
  },
  methods: {
    addshopingcartsuccess(message) {
      this.$notify({
        title: '成功',
        duration: 0,
        message: message,
        type: 'success'
      });
    },
    reload () {
      this.isShow= false
      this.$nextTick(function () {
        this.isShow= true
      })
    },

    clickaddshopingcart() {
      // startLoading()
      // this.tableHeader = ['index','productno','new_shortname','qty','new_qty','price','new_price','comment']
      this.totalprice = 0
      this.totalcount = 0
      this.Loading = true
      axios.post(host+'addshopingcart/batchAdd',{data:this.tableData}).then((res) => {
        if (res.status === 200 && res.data!= null){
          // this.res = res.data.data
          var respons = res.data.data
          // loading.close()
          this.Loading = false
          console.log(res.data.data)
          for (let i = 0; i <this.tableData.length ; i++) {
            this.tableData[i]['index'] = i+1
            for (let j = 0; j < respons.length; j++) {
              if (this.tableData[i]['productno']===respons[j]['productnumber']){
                this.tableData[i]['最新价格'] = respons[j]['discountedprice']
                this.tableData[i]['购物车数量'] = respons[j]['new_qty']
                this.tableData[i]['new_shortname'] = respons[j]['new_shortname']
              }
            }
          }
          for (let j = 0; j < respons.length; j++) {
            this.totalprice+=respons[j]['discountedprice']*respons[j]['new_qty']
            this.totalcount+=respons[j]['new_qty']
          }
          // this.$forceUpdate()
          console.log(this.tableData)
          this.$nextTick(()=>{
            this.key++;
          })

          this.addshopingcartsuccess('购物车成功添加了'+respons.length+'项')
          // this.reload()
        }
      }).then();
    },
    columnStyle({ row, column, rowIndex, columnIndex }) {
           // if (row['购物车数量']!=row['qty'] || row['price']!=row['最新价格']){
           if (row['购物车数量']!=row['qty'] ){
             return 'background:	#FFF8DC;'
           }else {
             return 'background:	#17dd31;'
           }
     },
    beforeUpload(file) {
      const isLt1M = file.size / 1024 / 1024 < 1

      if (isLt1M) {
        return true
      }

      this.$message({
        message: 'Please do not upload files larger than 1m in size.',
        type: 'warning'
      })
      return false
    },
    handleSuccess({ results, header }) {
      var obj = {}
      var l = []
      this._totalcount = 0
      for (let i = 0; i < results.length; i++) {
        this._totalcount += results[i]['qty']
        if (Object.hasOwn(obj, results[i]['productno'])){
          console.log(obj[results[i]['productno']])
          obj[results[i]['productno']]['qty'] += results[i]['qty']
        }else {
          obj[results[i]['productno']] = results[i]
        }

      }
      for(var key in obj){
        l.push(obj[key])
      }
      this.tableData = l
      this.tableHeader = ['index','productno','new_shortname','qty','购物车数量','price','最新价格','comment']
      // this.tableHeader = header
    }
  }
}
</script>
