<template>
  <div class="app-container">
    <!-- 查询条件区域 -->
    <el-card class="filter-container" shadow="hover">
      <div class="filter-item-group">
        <!-- 订单状态选择 -->
        <el-select
          v-model="queryParams.status"
          placeholder="订单状态"
          clearable
          class="filter-item"
          style="width: 150px"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <!-- 客户选择 -->
        <el-select
          v-model="queryParams.customerId"
          filterable
          remote
          reserve-keyword
          placeholder="请输入客户名称"
          :remote-method="remoteSearchCustomer"
          :loading="customerLoading"
          clearable
          class="filter-item"
          style="width: 240px"
        >
          <el-option
            v-for="item in customerOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span style="float: left">{{ item.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ item.code }}</span>
          </el-option>
        </el-select>

        <!-- 日期选择 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="filter-item date-picker"
          style="width: 320px"
          :picker-options="pickerOptions"
        />

        <!-- 订单号搜索 -->
        <el-input
          v-model="queryParams.orderNo"
          placeholder="订单号"
          clearable
          class="filter-item"
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleQuery" />
        </el-input>

        <!-- 操作按钮组 -->
        <div class="button-group">
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button type="info" icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          <el-button 
            type="success" 
            icon="el-icon-download" 
            :loading="downloadLoading"
            @click="handleDownload"
          >导出Excel</el-button>
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
        <span>销售订单列表</span>
        <span class="total-info">共 {{ total }} 条记录</span>
      </div>
      
      <el-table
        :data="orderList"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.8)"
        height="calc(100vh - 280px)"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <!-- 选择列 -->
        <el-table-column type="selection" width="55" align="center" />
        
        <!-- 订单号 -->
        <el-table-column
          prop="billcode"
          label="订单号"
          width="180"
          fixed="left"
          align="center"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <el-link type="primary" @click.native.stop="showOrderDetail(scope.row)">
              {{ scope.row.billcode }}
            </el-link>
          </template>
        </el-table-column>
        
        <!-- 订单日期 -->
        <el-table-column
          prop="billdate"
          label="订单日期"
          width="120"
          align="center"
          sortable
        >
          <template slot-scope="scope">
            {{ formatDate(scope.row.billdate) }}
          </template>
        </el-table-column>

        <!-- 客户名称 -->
        <el-table-column
          prop="btypeid_fullname"
          label="客户名称"
          width="200"
          show-overflow-tooltip
        />

        <!-- 订单金额 -->
        <el-table-column
          prop="ordermoney"
          label="订单金额"
          width="120"
          align="right"
          sortable
        >
          <template slot-scope="scope">
            <span class="amount">{{ formatAmount(scope.row.ordermoney) }}</span>
          </template>
        </el-table-column>

        <!-- 订单数量 -->
        <el-table-column
          prop="orderqty"
          label="订单数量"
          width="100"
          align="right"
          sortable
        />

        <!-- 订单状态 -->
        <el-table-column
          prop="checkstate"
          label="订单状态"
          width="120"
          align="center"
        >
          <template slot-scope="scope">
            <el-tag 
              :type="getStatusType(scope.row.checkstate)" 
              effect="light"
              size="medium"
            >
              {{ scope.row.checkstate }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 经办人 -->
        <el-table-column
          prop="checke_fullname"
          label="经办人"
          width="120"
          align="center"
        />

        <!-- 项目 -->
        <el-table-column
          prop="dealbtypeid_fullname"
          label="项目"
          width="200"
          show-overflow-tooltip
        />

        <!-- 送货地址 -->
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

        <!-- 备注 -->
        <el-table-column
          prop="comment"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />

        <!-- 操作 -->
        <el-table-column
          label="操作"
          width="150"
          align="center"
          fixed="right"
        >
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click.stop="showOrderDetail(scope.row)"
            >详情</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-printer"
              @click.stop="printOrder(scope.row)"
            >打印</el-button>
            <el-dropdown 
              @command="(command) => handleCommand(command, scope.row)"
              trigger="click"
              @click.stop
            >
              <el-button size="mini" type="text" icon="el-icon-more">更多</el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="copy" icon="el-icon-copy-document">复制</el-dropdown-item>
                <el-dropdown-item command="track" icon="el-icon-truck">跟踪</el-dropdown-item>
                <el-dropdown-item 
                  command="export" 
                  icon="el-icon-download"
                  :disabled="scope.row.checkstate === '已作废'"
                >导出</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="queryParams.pageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      :title="`订单详情 - ${currentBillCode || ''}`"
      :visible.sync="dialogVisible"
      width="70%"
      :close-on-click-modal="false"
      v-loading="detailLoading"
      custom-class="detail-dialog"
      :append-to-body="true"
      :destroy-on-close="true"
    >
      <div class="detail-container" v-if="orderDetail && orderDetail.data && orderDetail.data.length">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单号">{{ currentBillCode }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentOrder.btypeid_fullname }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.checkstate)">{{ currentOrder.checkstate }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="经办人">{{ currentOrder.checke_fullname }}</el-descriptions-item>
          <el-descriptions-item label="订单日期">{{ formatDate(currentOrder.billdate) }}</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ currentOrder.orderqty }}</el-descriptions-item>
          <el-descriptions-item label="送货地址" :span="3">{{ currentOrder.sysdiy3_head }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ currentOrder.comment || '无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 订单明细 -->
        <div class="detail-title">
          <h3>订单明细</h3>
        </div>
        <el-table
          :data="orderDetail.data"
          border
          style="width: 100%"
          :max-height="400"
        >
          <el-table-column width="50" type="index" align="center" />
          <el-table-column label="库位" width="120" align="center" prop="position" />
          <el-table-column label="仓库" width="180" prop="kfullname">
            <template slot-scope="scope">
              {{ scope.row.kfullname }}
              <el-tag 
                type="info" 
                size="mini" 
                effect="plain"
              >库存 [{{ scope.row.accountqty }}/{{ scope.row.unit }}] 台</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="产品信息" min-width="180">
            <template slot-scope="scope">
              <div class="product-info">
                <div class="product-name">{{ scope.row.productName }}</div>
                <div class="product-spec">{{ scope.row.standard }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="出库数量" width="120" align="center">
            <template slot-scope="scope">
              <span class="quantity-tag">
                {{ scope.row.scanNum || 0 }} {{ scope.row.unit }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关 闭</el-button>
        <el-button type="primary" icon="el-icon-printer" @click="printOrderDetail">打 印</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import { host } from '@/settings'
import { parseTime } from '@/utils'

export default {
  name: 'SaleOrderQuery',
  data() {
    return {
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        status: '',
        customerId: '',
        orderNo: '',
        startDate: '',
        endDate: ''
      },
      // 日期范围
      dateRange: [],
      // 状态选项
      statusOptions: [
        { value: '审核通过单据', label: '审核通过单据' },
        { value: '待审核', label: '待审核' },
        { value: '无需审核', label: '无需审核' },
        { value: '已作废', label: '已作废' }
      ],
      // 客户选项
      customerOptions: [],
      customerLoading: false,
      // 日期选择器配置
      pickerOptions: {
        shortcuts: [
          {
            text: '最近一周',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },
      // 表格数据
      orderList: [],
      total: 0,
      loading: false,
      downloadLoading: false,
      // 选中的行
      selectedRows: [],
      // 详情对话框
      dialogVisible: false,
      detailLoading: false,
      currentOrder: {},
      currentBillCode: '',
      orderDetail: null
    }
  },
  created() {
    // 设置默认日期为当天
    const today = new Date()
    const formattedToday = parseTime(today, '{y}-{m}-{d}')
    this.dateRange = [formattedToday, formattedToday]
    
    // 初始加载数据
    this.getList()
  },
  methods: {
    // 获取订单列表
    getList() {
      this.loading = true
      
      // 处理日期范围
      const startDate = this.dateRange && this.dateRange.length > 0 ? this.dateRange[0] : ''
      const endDate = this.dateRange && this.dateRange.length > 1 ? this.dateRange[1] : ''
      
      // 发送请求
      axios.get(`${host}/outBoundList/date/${startDate}/${endDate}`, {
        timeout: 20000, // 将超时时间改为20秒
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (res.status === 200 && res.data != null) {
          if (res.data.data && Array.isArray(res.data.data)) {
            // 过滤状态（如果有选择）
            let filteredData = res.data.data.flat()
            if (this.queryParams.status) {
              filteredData = filteredData.filter(item => 
                item.checkstate === this.queryParams.status
              )
            }
            
            // 过滤订单号（如果有输入）
            if (this.queryParams.orderNo) {
              filteredData = filteredData.filter(item => 
                item.billcode && item.billcode.includes(this.queryParams.orderNo)
              )
            }
            
            this.orderList = filteredData
            this.total = this.orderList.length
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
    
    // 远程搜索客户
    remoteSearchCustomer(query) {
      if (query) {
        this.customerLoading = true
        axios.get(`${host}/customer/search`, { params: { keyword: query } })
          .then(res => {
            if (res.status === 200 && res.data) {
              this.customerOptions = res.data.data || []
            }
          })
          .catch(error => {
            console.error('搜索客户错误:', error)
          })
          .finally(() => {
            this.customerLoading = false
          })
      } else {
        this.customerOptions = []
      }
    },
    
    // 查询按钮点击
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    
    // 重置查询条件
    resetQuery() {
      this.queryParams = {
        status: '',
        orderNo: '',
        customerId: '',
        pageNum: 1,
        pageSize: 20
      }
      
      // 重置日期范围为今天
      const today = new Date()
      const formattedToday = parseTime(today, '{y}-{m}-{d}')
      this.dateRange = [formattedToday, formattedToday]
      
      // 重新查询
      this.getList()
    },
    
    // 每页条数改变
    handleSizeChange(size) {
      this.queryParams.pageSize = size
      this.getList()
    },
    
    // 当前页改变
    handleCurrentChange(page) {
      this.queryParams.pageNum = page
      this.getList()
    },
    
    // 选择行变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    
    // 行点击事件
    handleRowClick(row, column, event) {
      // 如果点击的是操作列或选择列，不执行详情查看
      if (column.type === 'selection' || column.label === '操作') {
        return
      }
      this.showOrderDetail(row)
    },
    
    // 显示订单详情
    showOrderDetail(row) {
      if (!row.billnumberid) {
        this.$message.warning('无法获取订单ID')
        return
      }
      
      this.dialogVisible = true
      this.detailLoading = true
      this.orderDetail = null
      this.currentOrder = { ...row }
      this.currentBillCode = row.billcode
      
      // 获取订单详情
      axios.get(`${host}/outBoundList/${row.billnumberid}`, {
        timeout: 20000, // 将超时时间改为20秒
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (res.status === 200 && res.data) {
            this.orderDetail = res.data
            this.$message.success('获取详情成功')
          } else {
            this.$message.error('获取详情失败')
          }
        })
        .catch(error => {
          console.error('获取订单详情错误:', error)
          this.$message.error('获取订单详情失败')
        })
        .finally(() => {
          this.detailLoading = false
        })
    },
    
    // 打印订单
    printOrder(row) {
      this.$message.info(`正在准备打印订单: ${row.billcode}`)
      // 实际打印逻辑
    },
    
    // 打印订单详情
    printOrderDetail() {
      this.$message.info(`正在准备打印订单详情: ${this.currentBillCode}`)
      // 实际打印逻辑
    },
    
    // 处理更多操作命令
    handleCommand(command, row) {
      switch (command) {
        case 'copy':
          this.$message.info(`复制订单: ${row.billcode}`)
          break
        case 'track':
          this.$message.info(`跟踪订单: ${row.billcode}`)
          break
        case 'export':
          this.$message.info(`导出订单: ${row.billcode}`)
          break
        default:
          break
      }
    },
    
    // 导出Excel
    handleDownload() {
      this.downloadLoading = true
      
      // 如果有选中行，则只导出选中的行
      const list = this.selectedRows.length > 0 ? this.selectedRows : this.orderList
      
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = [
          '订单号',
          '订单日期',
          '客户名称',
          '订单金额',
          '订单数量',
          '订单状态',
          '经办人',
          '项目',
          '送货地址',
          '备注'
        ]
        
        const filterVal = [
          'billcode',
          'billdate',
          'btypeid_fullname',
          'ordermoney',
          'orderqty',
          'checkstate',
          'checke_fullname',
          'dealbtypeid_fullname',
          'sysdiy3_head',
          'comment'
        ]
        
        const data = this.formatJson(filterVal, list)
        
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: `销售订单查询_${this.dateRange[0]}_${this.dateRange[1]}`,
          autoWidth: true,
          bookType: 'xlsx'
        })
        
        this.$message.success('导出成功')
        this.downloadLoading = false
      })
    },
    
    // 格式化JSON数据
    formatJson(filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'billdate') {
          return this.formatDate(v[j])
        } else if (j === 'ordermoney') {
          return this.formatAmount(v[j], false)
        } else {
          return v[j] != null ? v[j] : ''
        }
      }))
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date || date === 'new Date') return '-'
      return date.split('T')[0]
    },
    
    // 格式化金额
    formatAmount(amount, includeSymbol = true) {
      if (amount == null) return includeSymbol ? '¥0.00' : '0.00'
      const value = parseFloat(amount).toFixed(2)
      return includeSymbol ? `¥${value}` : value
    },
    
    // 获取状态类型
    getStatusType(status) {
      const statusMap = {
        '审核通过单据': 'success',
        '待审核': 'warning',
        '无需审核': 'info',
        '已作废': 'danger'
      }
      return statusMap[status] || 'info'
    }
  }
}
</script>

<style lang="scss" scoped>
// 定义主题变量
$primary-color: #409EFF;
$success-color: #67C23A;
$warning-color: #E6A23C;
$danger-color: #F56C6C;
$info-color: #909399;

$bg-color: #f5f7fa;
$border-color: #dcdfe6;
$text-color: #303133;
$text-color-secondary: #606266;

.app-container {
  padding: 20px;
  background-color: $bg-color;

  .filter-container {
    margin-bottom: 16px;
    
    .filter-item-group {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      
      .filter-item {
        margin-right: 0;
      }
      
      .button-group {
        margin-left: auto;
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .table-container {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .total-info {
        color: $text-color-secondary;
        font-size: 14px;
      }
    }
    
    .pagination-container {
      padding: 16px 0;
      text-align: right;
    }
  }
  
  .detail-container {
    .detail-title {
      margin: 24px 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid $border-color;
      
      h3 {
        font-size: 16px;
        font-weight: 500;
        color: $text-color;
        margin: 0;
      }
    }
    
    .order-summary {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding: 16px;
      background-color: #f8f8f8;
      border-radius: 4px;
      
      .summary-item {
        margin-left: 32px;
        
        .label {
          margin-right: 8px;
          color: $text-color-secondary;
        }
        
        .value {
          font-weight: 600;
          color: $text-color;
          
          &.amount {
            color: $danger-color;
          }
        }
      }
    }
  }
}

.amount {
  color: $danger-color;
  font-weight: 500;
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

// 自定义对话框样式
::v-deep .detail-dialog {
  .el-dialog__body {
    padding: 20px;
  }
  
  .el-descriptions {
    margin-bottom: 20px;
  }
  
  .el-descriptions__label {
    width: 120px;
  }
}
</style> 