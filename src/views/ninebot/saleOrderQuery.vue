<template>
  <div class="app-container">
    <!-- 查询条件区域 -->
    <el-card class="filter-container" shadow="hover">
      <div class="filter-item-group">
        <!-- 订单状态选择 -->
        <!-- <el-select
          v-model="orderStatus"
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
        </el-select> -->

        <!-- 客户选择 -->
        <!-- <el-select
          v-model="customerId"
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
        </el-select> -->

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
          v-model="orderNumber"
          placeholder="订单号"
          clearable
          class="filter-item"
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        >
          <!-- <el-button slot="append" icon="el-icon-search" @click="handleQuery" /> -->
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
        <div class="header-left">
          <span class="header-title">销售订单列表</span>
          <el-radio-group v-model="filterType" size="small" @change="handleFilterChange">
            <el-radio-button label="unreferenced">未引用</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
        <span class="total-info">共 {{ total }} 条记录</span>
      </div>

      <!-- 使用标签页展示不同仓库的订单 -->
      <el-tabs
        v-model="activeWarehouse"
        type="border-card"
        class="custom-tabs"
      >
        <el-tab-pane
          v-for="(warehouseOrders, index) in filteredTableData"
          :key="index"
          :label="index === 0 ? '盛佳' : 'YAO'"
          :name="index"
        >
          <div class="warehouse-header">
            <div class="warehouse-info">
              <i class="el-icon-office-building" />
              <span class="warehouse-name">{{ index === 0 ? '盛佳仓库' : 'YAO仓库' }}</span>
            </div>
            <span class="warehouse-count">
              <i class="el-icon-document" />
              共 {{ warehouseOrders.length }} 条记录
            </span>
          </div>

          <el-table
            v-loading="loading"
            :data="warehouseOrders"
            border
            stripe
            style="width: 100%"
            element-loading-text="加载中..."
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(0, 0, 0, 0.8)"
            height="calc(100vh - 380px)"
            row-key="billnumberid"
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
                <el-link
                  type="primary"
                  @click.native.stop="showOrderDetail(scope.row)"
                >
                  {{ scope.row.billcode }}
                </el-link>
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

            <!-- 引用状态 -->
            <el-table-column
              prop="statename"
              label="引用状态"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="getReferenceStateType(scope.row.statename)"
                  effect="light"
                  size="medium"
                >
                  {{ scope.row.statename || '未知' }}
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
              prop="printcount"
              label="打印次数"
              width="120"
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
                  <i class="el-icon-location-information" style="margin-right: 5px" />
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
                  trigger="click"
                  @command="(command) => handleCommand(command, scope.row)"
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
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-loading="detailLoading"
      :title="`订单详情 - ${currentBillCode || ''}`"
      :visible.sync="dialogVisible"
      width="70%"
      custom-class="detail-dialog"
      :append-to-body="true"
      :destroy-on-close="true"
    >
      <div v-if="orderDetail && orderDetail.data && orderDetail.data.length" class="detail-container">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单号">{{ currentBillCode }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentOrder.btypeid_fullname }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.checkstate)">{{ currentOrder.checkstate }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="经办人">{{ currentOrder.checke_fullname }}</el-descriptions-item>
          <el-descriptions-item label="订单日期">{{ formatDate(currentOrder.billdate) }}</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ currentOrder.orderqty }}</el-descriptions-item>
          <el-descriptions-item label="引用状态">
            <el-tag :type="getReferenceStateType(currentOrder.statename)">{{ currentOrder.statename || '未知' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ formatAmount(currentOrder.ordermoney) }}</el-descriptions-item>
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
          <el-table-column label="产品信息" min-width="180">
            <template slot-scope="scope">
              <div class="product-info">
                <div class="product-name">{{ scope.row.productName }}</div>
                <div class="product-spec">{{ scope.row.standard }}</div>
              </div>
            </template>
          </el-table-column>
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
          <el-table-column label="库位" width="120" align="center" prop="position" />

          <el-table-column label="库存" width="120" align="center">
            <template slot-scope="scope">
              <span
                class="quantity-tag"
              >
                {{ scope.row.accountqty }} {{ scope.row.unit }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="今日出库" width="120" align="center">
            <template slot-scope="scope">
              <span
                class="today-quantity-tag"
                :class="{
                  'today-exceed': scope.row.draftQty && scope.row.draftQty > 0
                }"
              >
                {{ scope.row.draftQty }} {{ scope.row.unit }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="出库数量" width="120" align="center">
            <template slot-scope="scope">
              <span
                class="quantity-tag"
                :class="{
                  'quantity-exceed': scope.row.scanNum > scope.row.accountqty + scope.row.draftQty,
                  'quantity-equal': scope.row.scanNum === scope.row.accountqty + scope.row.draftQty,
                  'quantity-below': scope.row.scanNum < scope.row.accountqty + scope.row.draftQty
                }"
              >
                {{ scope.row.scanNum }} {{ scope.row.unit }}
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

    <!-- 打印模板 (隐藏) -->
    <div id="printSection" style="display: none;">
      <div v-if="orderDetail && orderDetail.data && orderDetail.data.length" class="print-container">
        <div class="print-header">
          <h1>出库拣货单</h1>
          <div id="qrcode-placeholder" class="print-qrcode">
            <img :src="orderQrCode" alt="订单二维码" class="qr-code-img">
          </div>
        </div>

        <div class="print-order-info">
          <table class="print-info-table">
            <tbody>
              <tr>
                <td class="print-label">订单号:</td>
                <td class="print-value">{{ currentBillCode }}</td>
                <td class="print-label">客户名称:</td>
                <td class="print-value">{{ currentOrder.btypeid_fullname }}</td>
                <td class="print-label">订单状态:</td>
                <td class="print-value">{{ currentOrder.checkstate }}</td>
              </tr>
              <tr>
                <td class="print-label">经办人:</td>
                <td class="print-value">{{ currentOrder.checke_fullname }}</td>
                <td class="print-label">订单日期:</td>
                <td class="print-value">{{ formatDate(currentOrder.billdate) }}</td>
                <td class="print-label">订单数量:</td>
                <td class="print-value">{{ currentOrder.orderqty }}</td>
              </tr>
              <tr>
                <td class="print-label">引用状态:</td>
                <td class="print-value">{{ currentOrder.statename || '未知' }}</td>
                <td class="print-label">订单金额:</td>
                <td class="print-value">{{ formatAmount(currentOrder.ordermoney) }}</td>
                <td class="print-label" />
                <td class="print-value" />
              </tr>
              <tr>
                <td class="print-label">送货地址:</td>
                <td class="print-value" colspan="5">{{ currentOrder.sysdiy3_head }}</td>
              </tr>
              <tr>
                <td class="print-label">备注:</td>
                <td class="print-value" colspan="5">{{ currentOrder.comment || '无' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="print-detail">
          <h2>订单明细</h2>
          <table class="print-detail-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>产品名称</th>
                <th>规格</th>
                <th>仓库</th>
                <th>库位</th>
                <th>库存</th>
                <th>今日出库</th>
                <th>出库数量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in orderDetail.data" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.productName }}</td>
                <td>{{ item.standard }}</td>
                <td>{{ item.kfullname }}</td>
                <td>{{ item.position }}</td>
                <td
                  :class="{
                    'print-quantity-exceed': item.scanNum > item.accountqty + item.draftQty,
                    'print-quantity-equal': item.scanNum === item.accountqty + item.draftQty,
                    'print-quantity-below': item.scanNum < item.accountqty + item.draftQty
                  }"
                >{{ item.accountqty }} {{ item.unit }}</td>
                <td :class="{'print-today-exceed': item.draftQty && item.draftQty > 0}">
                  {{ item.draftQty }} {{ item.unit }}
                </td>
                <td>{{ item.scanNum }} {{ item.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- <div class="print-footer">
          <div class="print-signatures">
            <div class="signature-box">
              <div>制单人:</div>
              <div class="signature-line" />
            </div>
            <div class="signature-box">
              <div>审核人:</div>
              <div class="signature-line" />
            </div>
            <div class="signature-box">
              <div>收货人:</div>
              <div class="signature-line" />
            </div>
          </div>
          <div class="page-number">第 1 页</div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { host } from '@/settings'
import { parseTime } from '@/utils'

// API基础URL
const API_BASE_URL = host

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
        { value: '已作废', label: '已作废' },
        // 引用状态选项
        { value: '未审核', label: '未审核' },
        { value: '审核中', label: '审核中' },
        { value: '已引用未完成', label: '已引用未完成' },
        { value: '已引用完成', label: '已引用完成' },
        { value: '已完成', label: '已完成' }
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
      tableData: [],
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
      orderDetail: null,
      activeWarehouse: 0,
      filterType: 'unreferenced',
      rawTableData: [],
      // 新增QR码数据
      orderQrCode: ''
    }
  },
  computed: {
    // 处理表格数据，根据筛选条件过滤
    filteredTableData() {
      if (!this.rawTableData || !Array.isArray(this.rawTableData)) {
        return []
      }

      // 根据筛选类型过滤数据
      const filteredData = this.rawTableData.map(warehouseOrders => {
        if (!Array.isArray(warehouseOrders)) return warehouseOrders

        return warehouseOrders.filter(order => {
          if (this.filterType === 'unreferenced') {
            return order.statename === '未引用'
          }
          return true // 全部数据
        })
      })

      return filteredData
    }
  },
  created() {
    // 页面创建时初始化数据
    this.resetQuery()
    // 加载数据
    this.getOrderList()
  },
  methods: {
    // 获取订单列表数据
    getOrderList() {
      this.loading = true

      // 构建API URL
      const startDate = this.dateRange && this.dateRange.length > 0 ? this.dateRange[0] : ''
      const endDate = this.dateRange && this.dateRange.length > 1 ? this.dateRange[1] : ''
      const apiUrl = `${API_BASE_URL}/outBoundList/date/${startDate}/${endDate}`

      // 调用API获取数据
      axios.get(apiUrl)
        .then(res => {
          if (res.status === 200 && res.data) {
            console.log('API响应数据:', res.data)

            // 保存原始数据
            this.rawTableData = res.data.data

            // 根据当前筛选条件过滤数据
            this.tableData = this.filteredTableData

            // 根据订单号过滤数据
            if (this.orderNumber) {
              const keyword = this.orderNumber.toLowerCase()

              // 对所有仓库的数据进行过滤
              this.tableData = this.tableData.map(warehouseOrders => {
                if (!Array.isArray(warehouseOrders)) return warehouseOrders

                return warehouseOrders.filter(order => {
                  return (order.billcode && order.billcode.toLowerCase().includes(keyword)) ||
                         (order.billnumberid && String(order.billnumberid).toLowerCase().includes(keyword))
                })
              })
            }

            // 更新总数
            this.total = this.tableData.reduce((sum, arr) =>
              sum + (Array.isArray(arr) ? arr.length : 0), 0)
          } else {
            this.$message.error('获取订单列表失败')
            this.tableData = []
            this.rawTableData = []
            this.total = 0
          }
        })
        .catch(error => {
          console.error('获取订单列表失败:', error)
          this.$message.error('获取订单列表失败')
          this.tableData = []
          this.rawTableData = []
          this.total = 0
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 显示订单详情
    showOrderDetail(item) {
      // 获取明细数据
      if (item && item.billnumberid) {
        console.log('准备获取订单详情:', item.billcode, '订单ID:', item.billnumberid)
        // const details = []

        this.dialogVisible = true
        this.detailLoading = true
        this.orderDetail = null
        this.currentOrder = { ...item }
        this.currentBillCode = item.billcode

        // 生成订单号二维码
        this.generateQRCode(item.billcode)

        // 调用API获取订单详情
        const apiUrl = `${API_BASE_URL}/outBoundList/${item.billnumberid}-${item.billcode}`
        console.log('请求真实API:', apiUrl)

        axios.get(apiUrl)
          .then(res => {
            if (res.status === 200 && res.data) {
              // 处理返回的数据格式
              const detailData = res.data.data.map(item => ({
                id: item.billnumberId,
                position: item.position,
                kfullname: item.kfullname,
                productName: item.productName,
                standard: item.standard,
                unit: item.unit,
                scanNum: item.scanNum,
                accountqty: item.accountqty,
                draftQty: item.draftQty || 0 // 添加今日出库数量字段
              }))
              this.orderDetail = { data: detailData }
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
      }
    },

    // 生成二维码
    generateQRCode(text) {
      // 使用在线服务生成二维码
      this.orderQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(text)}`
    },

    // 打印订单
    printOrder(row) {
      // 先获取详情，然后打印
      this.showOrderDetail(row)

      // 等待详情加载完成后打印
      this.$nextTick(() => {
        const checkDetailLoaded = setInterval(() => {
          if (!this.detailLoading && this.orderDetail) {
            clearInterval(checkDetailLoaded)
            this.printOrderDetail()
          }
        }, 200)

        // 设置超时，防止无限等待
        setTimeout(() => {
          clearInterval(checkDetailLoaded)
        }, 5000)
      })
    },

    // 打印订单详情
    printOrderDetail() {
      if (!this.orderDetail || !this.orderDetail.data) {
        this.$message.warning('没有可打印的订单详情数据')
        return
      }

      // 创建打印窗口
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        this.$message.error('无法创建打印窗口，请检查浏览器是否阻止弹出窗口')
        return
      }

      // 获取打印内容
      const printContent = document.getElementById('printSection').innerHTML

      // 写入HTML头部
      printWindow.document.write('<!DOCTYPE html>')
      printWindow.document.write('<html>')
      printWindow.document.write('<head>')
      printWindow.document.write('<title>订单详情 - ' + this.currentBillCode + '</title>')

      // 写入样式
      printWindow.document.write('<style>')
      printWindow.document.write('@media print {')
      printWindow.document.write('  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }')
      printWindow.document.write('  .print-container { padding: 20px; }')
      printWindow.document.write('  .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }')
      printWindow.document.write('  .print-header h1 { margin: 0; font-size: 24px; }')
      printWindow.document.write('  .print-qrcode { width: 100px; height: 100px; }')
      printWindow.document.write('  .qr-code-img { width: 100%; height: 100%; }')
      printWindow.document.write('  .print-info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }')
      printWindow.document.write('  .print-info-table td { padding: 5px; font-size: 14px; }')
      printWindow.document.write('  .print-label { font-weight: bold; width: 80px; }')
      printWindow.document.write('  .print-detail h2 { font-size: 18px; margin-bottom: 10px; }')
      printWindow.document.write('  .print-detail-table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; }')
      printWindow.document.write('  .print-detail-table th, .print-detail-table td { border: 1px solid #ddd; padding: 8px; font-size: 14px; text-align: center; }')
      printWindow.document.write('  .print-detail-table th { background-color: #f2f2f2; }')
      printWindow.document.write('  .print-quantity-exceed { background-color: #fef0f0 !important; color: #f56c6c !important; }')
      printWindow.document.write('  .print-quantity-equal { background-color: #fdf6ec !important; color: #e6a23c !important; }')
      printWindow.document.write('  .print-quantity-below { background-color: #f0f9eb !important; color: #67c23a !important; }')
      printWindow.document.write('  .print-today-exceed { background-color: #ecf5ff !important; color: #409EFF !important; }')
      printWindow.document.write('  .print-footer { margin-top: 30px; }')
      printWindow.document.write('  .print-signatures { display: flex; justify-content: space-between; margin-bottom: 20px; }')
      printWindow.document.write('  .signature-box { width: 30%; }')
      printWindow.document.write('  .signature-line { margin-top: 30px; border-bottom: 1px solid #000; }')
      printWindow.document.write('  .page-number { text-align: center; font-size: 12px; }')
      printWindow.document.write('}')
      printWindow.document.write('</style>')
      printWindow.document.write('</head>')

      // 写入主体内容
      printWindow.document.write('<body>')
      printWindow.document.write(printContent)

      // 写入脚本
      printWindow.document.write('<script>')
      printWindow.document.write('window.onload = function() {')
      printWindow.document.write('  setTimeout(function() {')
      printWindow.document.write('    window.print();')
      printWindow.document.write('    setTimeout(function() {')
      printWindow.document.write('      window.close();')
      printWindow.document.write('    }, 500);')
      printWindow.document.write('  }, 200);')
      printWindow.document.write('};')
      printWindow.document.write('<\/script>')

      // 完成HTML
      printWindow.document.write('</body>')
      printWindow.document.write('</html>')
      printWindow.document.close()

      // 提示用户
      this.$message.success('正在打印订单详情')
    },

    // 获取当前日期
    getCurrentDate() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hour = String(now.getHours()).padStart(2, '0')
      const minute = String(now.getMinutes()).padStart(2, '0')

      return `${year}-${month}-${day} ${hour}:${minute}`
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

      // 获取仓库数据
      const warehouseData = []
      const warehouseNames = ['盛佳仓库', 'YAO仓库']

      // 准备每个仓库的数据 - 使用原始数据而非过滤后的数据
      this.rawTableData.forEach((warehouseOrders, index) => {
        if (Array.isArray(warehouseOrders) && warehouseOrders.length > 0) {
          // 为每条记录添加仓库标识
          const data = warehouseOrders.map(order => ({
            ...order,
            warehouseName: warehouseNames[index] || `仓库${index + 1}`
          }))
          warehouseData.push(...data)
        }
      })

      if (warehouseData.length === 0) {
        this.$message.warning('没有可导出的数据')
        this.downloadLoading = false
        return
      }

      console.log('准备导出数据:', warehouseData.length, '条记录')

      // 导出文件名
      const startDate = this.dateRange && this.dateRange.length > 0 ? this.dateRange[0] : ''
      const endDate = this.dateRange && this.dateRange.length > 1 ? this.dateRange[1] : ''
      const fileName = `销售订单查询_${startDate}_${endDate}`

      // 定义表头和字段
      const tHeader = [
        '仓库',
        '订单号',
        '订单日期',
        '客户名称',
        '订单金额',
        '订单数量',
        '订单状态',
        '引用状态',
        '经办人',
        '项目',
        '送货地址',
        '备注'
      ]

      const filterVal = [
        'warehouseName',
        'billcode',
        'billdate',
        'btypeid_fullname',
        'ordermoney',
        'orderqty',
        'checkstate',
        'statename',
        'checke_fullname',
        'dealbtypeid_fullname',
        'sysdiy3_head',
        'comment'
      ]

      this.$nextTick(() => {
        import('@/vendor/Export2Excel').then(excel => {
          try {
            // 使用单表格导出方法
            const data = this.formatJson(filterVal, warehouseData)

            excel.export_json_to_excel({
              header: tHeader,
              data,
              filename: fileName,
              autoWidth: true,
              bookType: 'xlsx'
            })

            this.$message.success(`导出成功，共 ${warehouseData.length} 条记录`)
          } catch (error) {
            console.error('导出Excel出错:', error)
            this.$message.error('导出失败: ' + error.message)
          } finally {
            this.downloadLoading = false
          }
        }).catch(error => {
          console.error('加载Export2Excel模块失败:', error)
          this.$message.error('导出失败: 无法加载导出模块')
          this.downloadLoading = false
        })
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
    },

    // 获取引用状态类型
    getReferenceStateType(status) {
      const statusMap = {
        '未审核': 'info',
        '审核中': 'warning',
        '已引用未完成': 'warning',
        '已引用完成': 'success',
        '已作废': 'danger',
        '已完成': 'success'
      }
      return statusMap[status] || 'info'
    },

    // 远程搜索客户
    remoteSearchCustomer(query) {
      if (query) {
        this.customerLoading = true
        axios.get(`${host}/customer/search`, { params: { keyword: query }})
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

    // 重置查询条件
    resetQuery() {
      // 重置查询参数为默认值
      this.orderStatus = ''
      this.orderNumber = ''
      this.customerId = ''

      // 设置默认日期为当天
      const today = new Date()
      const formattedToday = parseTime(today, '{y}-{m}-{d}')
      this.dateRange = [formattedToday, formattedToday]

      // 重置分页
      this.queryParams.pageNum = 1
      this.queryParams.pageSize = 20

      // 重新加载数据
      this.getOrderList()
    },

    // 执行查询操作
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getOrderList()
    },

    // 每页条数改变
    handleSizeChange(size) {
      this.queryParams.pageSize = size
      this.getOrderList()
    },

    // 当前页改变
    handleCurrentChange(page) {
      this.queryParams.pageNum = page
      this.getOrderList()
    },

    // 选择行变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 处理筛选切换
    handleFilterChange(value) {
      this.filterType = value
      // 更新总数
      this.total = this.filteredTableData.reduce((sum, arr) =>
        sum + (Array.isArray(arr) ? arr.length : 0), 0)
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
      padding: 16px 20px;
      background: linear-gradient(to right, #f8f9fa, #ffffff);
      border-bottom: 1px solid #ebeef5;

      .header-left {
        display: flex;
        align-items: center;
        gap: 24px;

        .el-radio-group {
          margin-left: 16px;
        }
      }

      .header-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;

        &::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 16px;
          background: #409EFF;
          margin-right: 8px;
          border-radius: 2px;
        }
      }

      .total-info {
        color: #606266;
        font-size: 14px;
        background: #f4f4f5;
        padding: 4px 12px;
        border-radius: 4px;
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

  .warehouse-header {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .warehouse-info {
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        font-size: 20px;
        color: #409EFF;
      }

      .warehouse-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .warehouse-count {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #606266;
      font-size: 14px;
      background: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

      i {
        color: #67C23A;
      }
    }
  }

  .warehouse-card {
    display: none;
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
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  display: inline-block;
  min-width: 60px;

  &.quantity-exceed {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fbc4c4;
  }

  &.quantity-equal {
    background-color: #fdf6ec;
    color: #e6a23c;
    border: 1px solid #f5dab1;
  }

  &.quantity-below {
    background-color: #f0f9eb;
    color: #67c23a;
    border: 1px solid #c2e7b0;
  }
}

.today-quantity-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  display: inline-block;
  min-width: 60px;
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #e9e9eb;

  &.today-exceed {
    background-color: #ecf5ff;
    color: #409EFF;
    border: 1px solid #b3d8ff;
  }
}

/* 添加打印表格中数量单元格的样式 */
#printSection {
  .print-quantity-exceed {
    background-color: #fef0f0 !important;
    color: #f56c6c !important;
  }

  .print-quantity-equal {
    background-color: #fdf6ec !important;
    color: #e6a23c !important;
  }

  .print-quantity-below {
    background-color: #f0f9eb !important;
    color: #67c23a !important;
  }

  .print-today-exceed {
    background-color: #ecf5ff !important;
    color: #409EFF !important;
  }
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

.custom-tabs {
  ::v-deep .el-tabs__header {
    margin-bottom: 0;
    background: #f8f9fa;
    border-bottom: 1px solid #dcdfe6;
    border-radius: 4px 4px 0 0;
  }

  ::v-deep .el-tabs__nav {
    border: none !important;
  }

  ::v-deep .el-tabs__item {
    height: 50px;
    line-height: 50px;
    font-size: 15px;
    padding: 0 20px;
    transition: all 0.3s;
    border: none !important;
    margin-right: 4px;

    &.is-active {
      background: #fff;
      color: #409EFF;
      font-weight: 600;
      border-radius: 4px 4px 0 0;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #409EFF;
      }
    }

    &:hover {
      color: #409EFF;
    }
  }

  ::v-deep .el-tabs__content {
    padding: 20px;
    background: #fff;
  }
}

.draft-item,
.has-draft-row,
.draft-switch {
  display: none;
}

.print-qrcode {
  width: 100px;
  height: 100px;
}

.qr-code-img {
  width: 100%;
  height: 100%;
}
</style>
