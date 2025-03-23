<template>
  <div class="app-container">
    <!-- 查询条件区域 -->
    <el-card class="filter-container" shadow="hover">
      <div class="filter-item-group">
        <!-- 单据类型选择 -->
        <el-select
          v-model="orderType"
          placeholder="请选择单据类型"
          class="filter-item"
          style="width: 180px"
        >
          <el-option
            v-for="item in orderTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <!-- 日期选择 -->
        <el-date-picker
          v-model="datevalue"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="filter-item date-picker"
        />

        <!-- 操作按钮组 -->
        <div class="button-group">
          <el-button type="primary" icon="el-icon-search" @click="getsummary">查询</el-button>
          <el-button 
            type="success" 
            icon="el-icon-download" 
            :loading="downloadLoading"
            @click="handleDownload"
          >导出Excel</el-button>
          <el-button 
            type="info" 
            icon="el-icon-tickets" 
            @click="goToSaleOrderQuery"
          >销售订单查询</el-button>
        </div>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card 
      class="table-container" 
      shadow="hover"
      style="margin-top: 16px;"
    >
      <div slot="header" class="card-header">
        <span>单据列表</span>
        <span class="total-info">共 {{ tableData.length }} 条记录</span>
      </div>
      
      <el-table
        :data="tableData"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.8)"
        height="calc(100vh - 280px)"
        @row-click="handleRowClick"
        @expand-change="handleExpandChange"
      >
        <!-- 展开列 -->
        <el-table-column type="expand">
          <template slot-scope="props">
            <div v-if="props.row.draft && props.row.draft.length > 0" class="expand-container">
              <div class="draft-info">
                <el-tag type="info" effect="plain" size="small">
                  草稿数量：{{ props.row.draft.length }}
                </el-tag>
              </div>
              <el-table
                :data="props.row.draft"
                border
                size="small"
                style="width: 100%"
              >
                <el-table-column
                  label="草稿编号"
                  prop="billcode"
                  width="150"
                  align="center"
                />
                <el-table-column
                  label="日期"
                  prop="billdate"
                  width="120"
                  align="center"
                >
                  <template slot-scope="scope">
                    {{ formatDate(scope.row.billdate) }}
                  </template>
                </el-table-column>
                <el-table-column
                  label="数量"
                  prop="orderqty"
                  width="80"
                  align="right"
                />
                <el-table-column
                  label="状态"
                  prop="checkstate"
                  width="100"
                  align="center"
                >
                  <template slot-scope="scope">
                    <span class="status-text">{{ scope.row.checkstate }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="备注"
                  prop="explain"
                  min-width="150"
                  show-overflow-tooltip
                />
              </el-table>
            </div>
            <div v-else-if="props.row.loadingDrafts" class="expand-loading">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else class="no-drafts">
              <el-empty description="暂无草稿数据" :image-size="60"></el-empty>
            </div>
          </template>
        </el-table-column>

        <!-- 主表列 -->
        <el-table-column
          prop="billcode"
          label="单据编号"
          width="150"
          fixed
          align="center"
        />
        
        <el-table-column
          prop="billdate"
          label="日期"
          width="120"
          align="center"
        >
          <template slot-scope="scope">
            {{ formatDate(scope.row.billdate) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="btypeid_fullname"
          label="客户名称"
          width="200"
          show-overflow-tooltip
        />

        <el-table-column
          prop="checke_fullname"
          label="经办人"
          width="120"
          align="center"
        />

        <el-table-column
          prop="orderqty"
          label="数量"
          width="80"
          align="right"
        />

        <el-table-column
          prop="checkstate"
          label="状态"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            <span 
              :class="{
                'status-text': true,
                'status-success': scope.row.checkstate === '审核通过单据',
                'status-warning': scope.row.checkstate === '待审核',
                'status-info': scope.row.checkstate === '无需审核',
                'status-danger': scope.row.checkstate === '已作废'
              }"
            >
              {{ scope.row.checkstate }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="dealbtypeid_fullname"
          label="项目"
          width="200"
          show-overflow-tooltip
        />

        <el-table-column
          prop="sysdiy3_head"
          label="送货地址"
          width="200"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <el-tooltip effect="dark" placement="top" :content="scope.row.sysdiy3_head">
              <i class="el-icon-location-information" style="margin-right: 5px"></i>
            </el-tooltip>
            {{ scope.row.sysdiy3_head }}
          </template>
        </el-table-column>

        <el-table-column
          prop="comment"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <!-- 添加模态窗口 -->
    <el-dialog
      :title="`单据详情 - ${currentBillCode}`"
      :visible.sync="dialogVisible"
      width="65%"
      :close-on-click-modal="false"
      v-loading="detailLoading"
      custom-class="detail-dialog"
      :append-to-body="true"
      :destroy-on-close="true"
      :show-close="true"
      :modal-append-to-body="true"
      :lock-scroll="true"
      transition-name="dialog-fade"
    >
      <div class="detail-container" v-if="orderDetail && orderDetail.data && orderDetail.data.length">
        <el-table
          :data="orderDetail.data"
          border
          style="width: 100%"
          :max-height="400"
        >
          <el-table-column width="40" type="index" align="center">
            <template slot-scope="scope">
              <div class="index-cell">
                <el-tag 
                  type="warning" 
                  size="mini" 
                  effect="dark"
                  class="index-tag"
                >{{ scope.$index + 1 }}</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="库位" width="120" align="center">
            <template slot-scope="scope">
              {{ scope.row.position }}
            </template>
          </el-table-column>
          
          <el-table-column label="仓库" width="180">
            <template slot-scope="scope">
              {{ scope.row.kfullname }}
              <el-tag 
                type="info" 
                size="mini" 
                effect="plain"
              >库存 [{{ scope.row.accountqty }}/{{ scope.row.unit }}] 台</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="产品信息">
            <template slot-scope="scope">
              <div class="product-info">
                <div class="product-name">{{ scope.row.productName }}</div>
                <div class="product-spec">{{ scope.row.standard }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="出库数量" 
            width="120" 
            align="center"
          >
            <template slot-scope="scope">
              <span class="quantity-tag">
                {{ scope.row.scanNum || 0 }} {{ scope.row.unit }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">关 闭</el-button>
        <el-button size="small" type="primary" @click="printOrderDetail">打 印</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// import { ref } from 'vue'
import axios from 'axios'
import { host } from '@/settings'
import BookTypeOption from '@/views/excel/components/BookTypeOption.vue'
import AutoWidthOption from '@/views/excel/components/AutoWidthOption.vue'
import FilenameOption from '@/views/excel/components/FilenameOption.vue'
import { parseTime } from '@/utils'
let loading

export default {
  // name: 'AddShoppingCart',
  components: { FilenameOption, AutoWidthOption, BookTypeOption },
  // components: { UploadExcelComponent },
  data() {
    const today = new Date()
    return {
      customervaluelist: ['000010005300073'],
      customerlist: [{'btypeid':'000010005300073' ,'fullname':'西善桥张兴配件'},{'btypeid':'000010005100146' ,'fullname':'热河南路九号'}],
      loading: false,
      datevalue: [this.formatDate(today), this.formatDate(today)],
      tableData: [],
      res: {},
      Loading: false,
      tableloading: false,
      isShow: false,
      key: 0,
      totalprice: 0,
      totalcount: 0,
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            picker.$emit('pick', new Date())
          }
        }, {
          text: '昨天',
          onClick(picker) {
            const date = new Date()
            date.setTime(date.getTime() - 3600 * 1000 * 24)
            picker.$emit('pick', date)
          }
        }, {
          text: '一周前',
          onClick(picker) {
            const date = new Date()
            date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', date)
          }
        }]
      },
      value1: '',
      value2: '',
      info: {
        stockDate:new Date(),  //日期
      },
      // keymap:{'date':'日期','bfullname':'经销商','total00':'转上期','bqaddtotal':'打款金额' ,'bqrectotal':'发货金额','qmtotal':'余额'}
      orderType: 'sale',
      orderTypeOptions: [
        { label: '销售订单', value: 'sale' },
        { label: '采购订单', value: 'purchase' }
      ],
      dialogVisible: false,
      detailLoading: false,
      orderDetail: null,
      downloadLoading: false,
      currentBillCode: '', // 当前查看的订单号
    }
  },
  computed: {
    hasExpandableRows() {
      return this.tableData.some(row => row.draft > 0)
    }
  },

  methods: {
    formatter(row, column) {
        return row.date;
    },
    getCustomerInfo(customerstr) {
      // this.loading = true;
      this.customerlist = []
      axios.get(host + 'getsummary/getCustomerInfo/' + customerstr).then((res) => {
        if (res.status === 200 && res.data != null) {
          console.log(res.data.data)
          this.customerlist = res.data.data
        }
      })
    },
    handleSelect(item) {
      console.log(item)
    },
    addshopingcartsuccess(message) {
      this.$notify({
        title: '成功',
        duration: 0,
        message: message,
        type: 'success'
      })
    },
    handleDelete(index, row) {
      this.tableData.splice(index, 1)
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = [
          '单据编号',
          '客户名称',
          '数量',
          '状态',
          '备注',
          '送货地址'
        ]
        
        const filterVal = [
          'billcode',
          'dealbtypeid_fullname',
          'orderqty',
          'checkstate',
          'explain',
          'sysdiy3_head'
        ]

        const list = this.tableData
        const data = this.formatJson(filterVal, list)
        
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: `单据查询_${this.datevalue[0]}_${this.datevalue[1]}`,
          autoWidth: true,
          bookType: 'xlsx'
        })
        
        this.$message.success('导出成功')
        this.downloadLoading = false
      })
    },
    formatJson(filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'ordermoney') {
          // 添加空值检查
          return v[j] ? `¥${Number(v[j]).toFixed(2)}` : '¥0.00'
        } else if (j === 'explain' && !v[j]) {
          return '-'
        } else {
          return v[j] || '-' // 添加默认值
        }
      }))
    },
    reload() {
      this.isShow = false
      this.$nextTick(function() {
        this.isShow = true
      })
    },
    mounted(){
      this.tableloading = true

    },
    onload(){

    },
    getSummaryApi(customerobj){
        for (const [btypeid, fullname] of Object.entries(customerobj)){
          this.tableloading = true
          axios.post(host + 'getsummary/getsummary', { 'daterange': this.datevalue, 'btypeid': btypeid,'bfullname':fullname }).then((res) => {
            if (res.status === 200 && res.data != null) {
              var obj = {}
              for (let i = 0; i < res.data.data.length; i++) {
                obj =  res.data.data[i]
                  this.tableData.push(obj)
              }
              this.tableloading = false
            }else {
              this.tableloading = false
            }
          })
       }
    },
    getsummary() {
      this.loading = true
      this.tableData = [] // 清空之前的数据
      
      const startDate = this.datevalue[0]
      const endDate = this.datevalue[1]
      // 使用统一的请求URL
      const url = `${host}/outBoundList/date/${startDate}/${endDate}`
      
      axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (res.status === 200 && res.data != null) {
          if (res.data.data && Array.isArray(res.data.data)) {
            this.tableData = res.data.data.flat()
          }
          this.$message.success('查询成功')
        } else {
          this.$message.error('返回数据格式错误')
        }
      }).catch(error => {
        if (error.code === 'ECONNABORTED') {
          this.$message.error('请求超时，请检查网络连接')
        } else if (error.response) {
          this.$message.error(`请求失败: ${error.response.status}`)
        } else {
          this.$message.error(`请求错误: ${error.message}`)
        }
        console.error('请求错误:', error)
      }).finally(() => {
        this.loading = false
      })
    },
    cellStyle({ row, column, rowIndex, columnIndex }) {
      return {
        padding: '12px 0',
        height: '50px'
      }
    },
    formatDate(date) {
      if (!date || date === 'new Date') return '-'
      return date.split('T')[0]
    },
    getStatusType(status) {
      const statusMap = {
        '审核通过单据': 'success',
        '待审核单据': 'warning',
        '未引用': 'info',
        '已引用未完成': 'primary'
      }
      return statusMap[status] || 'info'
    },
    // 添加行点击事件处理
    handleRowClick(row, column, event) {
      // 如果点击的是展开按钮，不执行详情查看
      if (column.type === 'expand') {
        return
      }
      this.showOrderDetail(row.billcode, row)
    },
    
    // 显示订单详情
    async showOrderDetail(billcode, row) {
      if (!row.billnumberid) {
        this.$message.warning('无法获取订单ID')
        return
      }
      
      this.dialogVisible = true
      this.detailLoading = true
      this.orderDetail = null
      this.currentBillCode = billcode // 设置当前订单号
      
      try {
        // 直接使用行数据中的 billnumberid
        const response = await axios.get(`${host}/outBoundList/${row.billnumberid}`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.status === 200 && response.data) {
          this.orderDetail = response.data
          this.$message.success('获取详情成功')
        } else {
          this.$message.error('获取详情失败')
        }
      } catch (error) {
        this.$message.error(`获取详情出错: ${error.message}`)
        console.error('获取详情错误:', error)
      } finally {
        this.detailLoading = false
      }
    },
    
    // 打印订单详情
    printOrderDetail() {
      // 这里可以实现打印功能
      this.$message.info('打印功能开发中...')
    },
    getMoneyFormat(money) {
      return money ? `¥${Number(money).toFixed(2)}` : '¥0.00'
    },
    // 表头单元格样式
    headerCellStyle() {
      return {
        backgroundColor: '#F5F7FA',
        color: '#606266',
        fontWeight: '600',
        borderBottom: '2px solid #DCDFE6',
        padding: '12px 0',
        height: '48px'
      }
    },

    // 表格单元格样式
    cellStyle({ row, column, rowIndex, columnIndex }) {
      return {
        padding: '12px 0',
        height: '50px'
      }
    },
    getDraftStatusType(status) {
      const statusMap = {
        '已保存': 'info',
        '已提交': 'success',
        '已作废': 'danger'
      }
      return statusMap[status] || 'info'
    },
    // 处理展开行事件
    async handleExpandChange(row, expandedRows) {
      // 检查是否有草稿数据
      if (row.draft === undefined || row.draft === null) {
        // 设置加载状态
        this.$set(row, 'loadingDrafts', true)
        
        try {
          // 获取草稿数据
          const response = await axios.get(`${host}/outBoundList/drafts/${row.billnumberid || row.billcode}`, {
            timeout: 10000
          })
          
          if (response.status === 200 && response.data && response.data.data) {
            // 确保数据是数组
            const drafts = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
            // 使用 Vue.set 确保响应式更新
            this.$set(row, 'draft', drafts)
          } else {
            // 设置为空数组
            this.$set(row, 'draft', [])
          }
        } catch (error) {
          console.error('获取草稿数据错误:', error)
          this.$set(row, 'draft', [])
          this.$message.error('获取草稿数据失败')
        } finally {
          this.$set(row, 'loadingDrafts', false)
        }
      }
    },
    goToSaleOrderQuery() {
      this.$router.push('/ninebot/saleOrderQuery')
    }
  },
  created() {
    const today = new Date()
    const formattedToday = parseTime(today, '{y}-{m}-{d}')
    this.datevalue = [formattedToday, formattedToday]
  }
}
</script>
<style lang="scss" scoped>
// 定义灰色主题变量
$bg-gray: #f5f5f5;           // 主背景色
$bg-lighter: #ffffff;        // 较浅的背景色
$bg-darker: #eaeaea;         // 较深的背景色
$border-color: #e0e0e0;      // 边框颜色
$text-primary: #303133;      // 主要文字颜色
$text-secondary: #606266;    // 次要文字颜色
$hover-color: #f0f0f0;       // 悬停颜色

.app-container {
  padding: 20px;
  background-color: #f5f5f5;

  .filter-container {
    .el-card {
      background-color: $bg-lighter;
      border: 1px solid $border-color;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      ::v-deep .el-card__body {
        background-color: $bg-lighter;
      }
    }

    .filter-item-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  .table-container {
    margin-top: 16px;

    .el-card {
      background-color: $bg-lighter;
      border: 1px solid $border-color;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      .card-header {
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: $bg-darker;
        border-bottom: 1px solid $border-color;

        span {
          color: $text-primary;
          font-size: 14px;
          font-weight: 500;

          &.total-info {
            color: $text-secondary;
            font-size: 13px;
          }
        }
      }
    }

    ::v-deep {
      .el-table {
        background-color: #ffffff;
        border: 1px solid #d4d4d4;
        
        th.el-table__cell {
          background-color: #eaeaea;
          color: #303133;
          border-bottom: 1px solid #d4d4d4;
          border-right: 1px solid #d4d4d4;
          font-weight: 600;
          padding: 8px;
          height: 48px;
        }

        td.el-table__cell {
          background-color: #ffffff;
          border-bottom: 1px solid #d4d4d4;
          border-right: 1px solid #d4d4d4;
        }

        .el-table__fixed-right::before,
        .el-table__fixed::before {
          background-color: #d4d4d4;
        }

        .el-table__fixed-right,
        .el-table__fixed {
          background-color: #ffffff;
          border-right: 1px solid #d4d4d4;
        }

        .el-table__row--striped {
          td.el-table__cell {
            background-color: #f5f5f5;
          }
        }

        .el-table__row:hover {
          td.el-table__cell {
            background-color: #f0f0f0 !important;
          }
        }

        &::before {
          background-color: #d4d4d4;
          height: 1px;
        }
      }
    }
  }
}

// 滚动条样式
::v-deep {
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }

  ::-webkit-scrollbar-track {
    background: $bg-darker;
  }
}

.expand-container {
  padding: 20px;
  background-color: #fafafa;

  .draft-info {
    margin-bottom: 10px;
  }

  .el-table {
    margin-top: 10px;
    
    &::before {
      display: none;
    }
  }
}

.expand-loading {
  padding: 20px;
  background-color: #fafafa;
}

.no-drafts {
  padding: 20px;
  background-color: #fafafa;
  display: flex;
  justify-content: center;
}

.product-info {
  display: flex;
  flex-direction: column;
  
  .product-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .product-spec {
    font-size: 12px;
    color: #909399;
  }
}

.quantity-tag {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.index-cell {
  display: flex;
  justify-content: center;
  
  .index-tag {
    padding: 2px 6px;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  
  &.status-success {
    color: #67C23A;
  }
  
  &.status-warning {
    color: #E6A23C;
  }
  
  &.status-info {
    color: #909399;
  }
  
  &.status-danger {
    color: #F56C6C;
  }
}
</style>

