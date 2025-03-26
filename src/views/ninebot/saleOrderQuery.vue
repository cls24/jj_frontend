<template>
  <div class="app-container">
    <!-- 查询条件区域 -->
    <el-card class="filter-container" shadow="hover">
      <div class="filter-item-group">
        <!-- Mock数据开关 -->
        <el-switch
          v-model="mockSwitch"
          active-text="使用模拟数据"
          inactive-text="使用真实数据"
          class="filter-item mock-switch"
          @change="handleMockChange"
        />

        <!-- 订单状态选择 -->
        <el-select
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
        </el-select>

        <!-- 客户选择 -->
        <el-select
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
          v-model="orderNumber"
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
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
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

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-loading="detailLoading"
      :title="`订单详情 - ${currentBillCode || ''}`"
      :visible.sync="dialogVisible"
      width="70%"
      :close-on-click-modal="false"
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
// 引入本地JSON文件
import mockOrdersData from '@/mock/orders.json'

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
      // Mock开关状态
      mockSwitch: false,
      // Mock数据内部定义
      mockOrdersData: null,
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
      orderDetail: null
    }
  },
  created() {
    // 页面创建时初始化数据
    this.resetQuery()

    // 初始化mock数据
    this.initMockData()

    // 检查url参数中是否有mock标志
    const useLocalMock = this.$route.query.mock === '1'
    // 默认开启mock开关以便于测试
    this.mockSwitch = useLocalMock || true

    // 加载数据
    if (this.mockSwitch) {
      this.getMockData()
    } else {
      this.getOrderList()
    }
  },
  methods: {
    // 初始化Mock数据
    initMockData() {
      // 直接使用导入的本地JSON文件
      this.mockOrdersData = mockOrdersData
      console.log('已加载本地mock数据:', this.mockOrdersData ? '成功' : '失败', Object.keys(this.mockOrdersData || {}).length > 0 ? '包含数据' : '无数据')
    },

    // 获取订单列表数据
    getOrderList() {
      this.loading = true

      // 构建API URL
      const startDate = this.dateRange && this.dateRange.length > 0 ? this.dateRange[0] : ''
      const endDate = this.dateRange && this.dateRange.length > 1 ? this.dateRange[1] : ''
      const apiUrl = `http://192.168.1.200:8000/outBoundList/${startDate}/${endDate}`

      // 调用API获取数据
      axios.get(apiUrl)
        .then(res => {
          if (res.status === 200 && res.data) {
            this.tableData = res.data.data || []
            this.total = res.data.total || 0
          } else {
            this.$message.error('获取订单列表失败')
            this.tableData = []
            this.total = 0
          }
        })
        .catch(error => {
          console.error('获取订单列表失败:', error)
          this.$message.error('获取订单列表失败')
          this.tableData = []
          this.total = 0
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 获取Mock数据
    getMockData() {
      console.log('获取本地Mock数据')
      this.loading = true

      // 如果mockOrdersData为空，先初始化
      if (!this.mockOrdersData) {
        this.initMockData()
      }

      // 确保mockOrdersData已初始化
      if (!this.mockOrdersData || !this.mockOrdersData.data) {
        console.error('Mock数据结构不正确:', this.mockOrdersData)
        this.$message.error('获取模拟数据失败')
        this.loading = false
        return
      }

      try {
        // 处理嵌套数组结构
        let allOrders = []
        const rawData = this.mockOrdersData.data

        // 记录处理前的数据结构
        console.log('处理前的数据结构类型:', Array.isArray(rawData) ? 'Array' : typeof rawData)

        // 处理嵌套数组
        if (Array.isArray(rawData)) {
          rawData.forEach(outerArray => {
            if (Array.isArray(outerArray)) {
              console.log('找到内层数组，长度:', outerArray.length)
              allOrders = allOrders.concat(outerArray)
            } else {
              allOrders.push(outerArray)
            }
          })
        }

        console.log('扁平化后的订单数量:', allOrders.length)

        // 定义订单状态映射（orderstate 到 statename）
        const orderStateMap = {
          '0': '未审核',
          '1': '审核中',
          '2': '已引用未完成',
          '3': '已引用完成',
          '4': '已作废',
          '5': '已完成'
        }

        // 设置订单状态
        allOrders = allOrders.map(order => {
          // 复制对象，避免修改原始数据
          const newOrder = { ...order }

          // 根据orderstate设置statename作为引用状态
          if (newOrder.orderstate && orderStateMap[newOrder.orderstate]) {
            newOrder.statename = orderStateMap[newOrder.orderstate]
          }

          return newOrder
        })

        // 根据查询条件过滤数据
        let filteredOrders = allOrders

        // 根据订单状态过滤
        if (this.orderStatus) {
          filteredOrders = filteredOrders.filter(order =>
            order.checkstate === this.orderStatus ||
            order.statename === this.orderStatus
          )
        }

        // 根据订单号过滤
        if (this.orderNumber) {
          const keyword = this.orderNumber.toLowerCase()
          filteredOrders = filteredOrders.filter(order =>
            (order.billcode && order.billcode.toLowerCase().includes(keyword)) ||
            (order.billnumberid && String(order.billnumberid).toLowerCase().includes(keyword))
          )
        }

        console.log('过滤后的订单数量:', filteredOrders.length)
        this.tableData = filteredOrders
        this.total = filteredOrders.length
        this.$message.success('成功加载本地mock数据')
      } catch (error) {
        console.error('处理Mock数据出错:', error)
        this.$message.error('获取模拟数据失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // 显示订单详情
    showOrderDetail(item) {
      // 获取明细数据
      if (item && item.billnumberid) {
        console.log('准备获取订单详情:', item.billcode, '订单ID:', item.billnumberid)
        let details = []

        this.dialogVisible = true
        this.detailLoading = true
        this.orderDetail = null
        this.currentOrder = { ...item }
        this.currentBillCode = item.billcode

        // 如果开启了mock开关，从mock数据中获取
        if (this.mockSwitch) {
          console.log('从本地JSON文件获取订单详情')

          setTimeout(() => {
            try {
              // 从src/mock/orders_detail/对应的billnumberId文件中加载数据
              const billnumberId = item.billnumberid
              import(`@/mock/orders_detail/${billnumberId}.json`)
                .then(detailData => {
                  console.log('成功加载订单详情文件:', `${billnumberId}.json`)
                  if (detailData && detailData.data && Array.isArray(detailData.data)) {
                    details = this.processDraftDetails(detailData.data)
                    this.orderDetail = { data: details }
                    this.$message.success('获取本地模拟详情成功')
                  } else {
                    throw new Error('详情数据格式不正确')
                  }
                })
                .catch(error => {
                  console.error(`获取订单详情文件失败: ${error.message}`)
                  // 首先检查当前订单对象中是否有draft数组
                  if (item.draft && Array.isArray(item.draft) && item.draft.length > 0) {
                    console.log('当前订单对象中找到draft数组，条目数:', item.draft.length)
                    details = this.processDraftDetails(item.draft)
                  } else {
                    console.log('当前订单对象中无draft数组，尝试在完整mock数据中查找匹配订单')

                    // 在完整mock数据中查找匹配的订单
                    if (this.mockOrdersData && this.mockOrdersData.data) {
                      let foundOrder = null

                      // 遍历嵌套数组查找匹配的订单
                      this.mockOrdersData.data.forEach(outerArray => {
                        if (Array.isArray(outerArray)) {
                          outerArray.forEach(order => {
                            // 通过billnumberid或billcode匹配
                            if ((order.billnumberid && order.billnumberid === item.billnumberid) ||
                                (order.billcode && order.billcode === item.billcode)) {
                              foundOrder = order
                            }
                          })
                        }
                      })

                      // 如果找到匹配的订单，处理其draft数组
                      if (foundOrder && foundOrder.draft && Array.isArray(foundOrder.draft)) {
                        console.log('在完整mock数据中找到匹配订单，draft条目数:', foundOrder.draft.length)
                        details = this.processDraftDetails(foundOrder.draft)
                      }
                    }
                  }

                  // 如果仍然没有数据，生成紧急详情数据
                  if (!details || details.length === 0) {
                    console.log('无法找到详情数据，生成临时数据')
                    details = this.generateEmergencyDetailData(item)
                  }

                  this.orderDetail = { data: details }
                  this.$message.warning('使用备用数据显示详情')
                })
                .finally(() => {
                  this.detailLoading = false
                })
            } catch (error) {
              console.error('获取模拟详情失败:', error)
              this.$message.error(`获取模拟详情失败: ${error.message}`)

              // 降级处理 - 使用动态生成的详情数据
              this.orderDetail = {
                data: this.generateEmergencyDetailData(item)
              }
              this.detailLoading = false
            }
          }, 600)
        } else {
          // 正常API调用获取订单详情
          const apiUrl = `http://192.168.1.200:8000/outBoundList/${item.billnumberid}-${item.billcode}`
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
                  accountqty: item.accountqty
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
      }
    },

    // 处理draft数组数据转换为标准格式
    processDraftDetails(draftArray) {
      if (!draftArray || !Array.isArray(draftArray)) {
        return []
      }

      return draftArray.map((draft, index) => {
        return {
          id: draft.billnumberid || `DETAIL-${index}`,
          position: draft.position || `A区-${String.fromCharCode(65 + index)}-${index + 1}`,
          kfullname: draft.ktypeid_fullname || draft.kfullname || '默认仓库',
          productName: draft.btype_fullname || draft.productName || `商品-${index + 1}`,
          standard: draft.standard || '标准规格',
          unit: draft.unit || '台',
          scanNum: draft.totalqty || draft.scanNum || 0,
          accountqty: draft.accountqty || draft.mtotalmoney || 0
        }
      })
    },

    // 生成紧急详情数据
    generateEmergencyDetailData(item) {
      return [
        {
          id: 'EMERGENCY-1',
          position: 'A区-紧急-1',
          kfullname: item.btypeid_fullname || '默认仓库',
          productName: '紧急产品数据',
          standard: '标准规格',
          unit: '台',
          scanNum: Math.floor(item.orderqty / 2) || 10,
          accountqty: item.orderqty || 20
        },
        {
          id: 'EMERGENCY-2',
          position: 'B区-紧急-2',
          kfullname: item.btypeid_fullname || '默认仓库',
          productName: '紧急产品数据2',
          standard: '高级规格',
          unit: '台',
          scanNum: Math.ceil(item.orderqty / 2) || 10,
          accountqty: item.orderqty || 20
        }
      ]
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
      const list = this.selectedRows.length > 0 ? this.selectedRows : this.tableData

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
      if (this.mockSwitch) {
        this.getMockData()
      } else {
        this.getOrderList()
      }
    },

    // 执行查询操作
    handleQuery() {
      this.queryParams.pageNum = 1
      if (this.mockSwitch) {
        this.getMockData()
      } else {
        this.getOrderList()
      }
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

    // 行点击事件
    handleRowClick(row, column, event) {
      // 如果点击的是操作列或选择列，不执行详情查看
      if (column.type === 'selection' || column.label === '操作') {
        return
      }
      this.showOrderDetail(row)
    },

    // 处理mock开关变化
    handleMockChange(val) {
      console.log('Mock开关状态变更:', val)
      this.loading = true

      if (val) {
        // 切换到mock数据
        this.getMockData()
      } else {
        // 切换到真实API数据
        this.getOrderList()
      }
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

      .mock-switch {
        margin-right: 20px;
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
