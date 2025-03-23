<template>
  <div class="app-container">
    <!-- 查询条件区域 -->
    <el-card 
      class="filter-container" 
      shadow="hover"
      :body-style="{ padding: '20px' }"
    >
      <div class="filter-item-group">
        <!-- 单据类型多选框 -->
        <el-select
          v-model="selectedBillTypes"
          multiple
          collapse-tags
          placeholder="请选择单据类型"
          class="filter-item bill-type-select"
          :popper-class="'bill-type-dropdown'"
        >
          <el-option
            v-for="item in billTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
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
          :popper-class="'date-picker-dropdown'"
          :picker-options="{
            disabledDate(time) {
              return time.getTime() < new Date('2024-01-01').getTime() || time.getTime() > Date.now()
            }
          }"
        />

        <!-- 按钮组 -->
        <div class="button-group">
          <el-button 
            type="primary" 
            icon="el-icon-search" 
            @click="handleSearch"
            :loading="loading"
            class="search-button"
          >查询</el-button>

          <el-button
            type="success"
            icon="el-icon-download"
            :loading="downloadLoading"
            :disabled="!tableData.length"
            @click="handleDownload"
            class="export-button"
          >导出Excel</el-button>
        </div>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card 
      class="table-container" 
      shadow="hover"
      :body-style="{ padding: '0px' }"
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
        :header-cell-style="{ 
          backgroundColor: '#f5f7fa',
          color: '#606266',
          fontWeight: 600
        }"
        :cell-style="{ 
          padding: '12px 0',
          color: '#606266'
        }"
      >
        <el-table-column
          prop="billcode"
          label="单据编号"
          width="150"
          align="center"
          fixed
        />
        
        <el-table-column
          prop="billdate"
          label="日期"
          width="120"
          align="center"
        />

        <el-table-column
          prop="explain"
          label="摘要"
          width="180"
          show-overflow-tooltip
        />

        <el-table-column
          prop="checkename"
          label="经办人"
          width="120"
          align="center"
        />

        <el-table-column
          prop="auditedname"
          label="状态"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            <span 
              :class="{
                'status-text': true,
                'status-success': scope.row.auditedname === '已审核',
                'status-warning': scope.row.auditedname === '待 审 核',
                'status-info': scope.row.auditedname === '无需审核',
                'status-danger': scope.row.auditedname === '已作废'
              }"
            >
              {{ scope.row.auditedname }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="ktypeid_fullname"
          label="仓库"
          width="150"
          align="center"
        />

        <el-table-column
          prop="comment"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />

        <el-table-column
          prop="printcount"
          label="打印次数"
          width="100"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import { host } from '@/settings'
export default {
  name: 'IntermediateOrder',
  
  data() {
    const end = new Date()
    const start = new Date('2024-01-01')
    return {
      dateRange: [start, end],
      loading: false,
      downloadLoading: false,
      tableData: [],
      // 单据类型选项
      billTypeOptions: [
        { value: '11', label: '销售出库单' },
        { value: '45', label: '销售退货单' },
        { value: '142', label: '委托代销退货单' },
        { value: '34', label: '采购入库单' },
        { value: '17', label: '同价调拨单' },
        { value: '21', label: '变价调拨单' }
      ],
      // 默认选中 45 和 142
      selectedBillTypes: ['45', '142']
    }
  },

  methods: {
    // 处理查询
    async handleSearch() {
      if (!this.selectedBillTypes.length) {
        this.$message.warning('请至少选择一个单据类型')
        return
      }
      
      if (!this.dateRange || this.dateRange.length !== 2) {
        this.$message.warning('请选择日期范围')
        return
      }
      
      this.loading = true
      try {
        // 格式化日期
        const formatDate = (date) => {
          const d = new Date(date)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const response = await axios.post(`${host}/outBoundList/getOrderDraft/`, {
          billTypes: this.selectedBillTypes,
          startDate: formatDate(this.dateRange[0]),
          endDate: formatDate(this.dateRange[1])
        })
        
        if (response.status === 200 && response.data) {
          this.tableData = response.data.data || []
          if (this.tableData.length === 0) {
            this.$message.info('未查询到相关数据')
          }
        } else {
          this.$message.error('查询失败：' + (response.data.message || '未知错误'))
        }
      } catch (error) {
        console.error('查询出错：', error)
        this.$message.error('查询失败：' + (error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },

    // 获取状态标签类型
    getStatusType(status) {
      const statusMap = {
        '已审核': 'success',
        '待 审 核': 'warning',
        '无需审核': 'info',
        '已作废': 'danger'
      }
      return statusMap[status] || 'info'
    },

    async handleDownload() {
      this.downloadLoading = true
      try {
        import('@/vendor/Export2Excel').then(excel => {
          const tHeader = ['单据编号', '日期', '摘要', '经办人', '状态', '仓库', '备注', '打印次数']
          const filterVal = ['billcode', 'billdate', 'explain', 'checkename', 'auditedname', 'ktypeid_fullname', 'comment', 'printcount']
          const list = this.tableData
          const data = this.formatJson(filterVal, list)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '中间单据查询',
            autoWidth: true,
            bookType: 'xlsx'
          })
          this.downloadLoading = false
        })
      } catch (error) {
        this.$message.error('导出失败：' + error.message)
        this.downloadLoading = false
      }
    },

    formatJson(filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'billdate') {
          return this.formatDate(v[j])
        }
        return v[j]
      }))
    },

    formatDate(date) {
      if (!date) return ''
      return date.split('T')[0]
    }
  },
}
</script>

<style lang="scss" scoped>
.status-text {
  font-size: 13px;
  font-weight: 500;
  transition: color 0.3s ease;
  
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

.app-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 84px);

  .filter-container {
    background-color: #ffffff;
    border-radius: 4px;
    transition: all 0.3s ease;

    .filter-item-group {
      display: flex;
      align-items: center;
      gap: 16px;

      .date-picker {
        width: 360px;
      }

      .bill-type-select {
        width: 300px;
      }

      .button-group {
        display: flex;
        gap: 8px;
        margin-left: auto;

        .search-button,
        .export-button {
          padding: 9px 20px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }
        }
      }

      ::v-deep .el-select__tags {
        max-width: calc(100% - 30px);
      }
    }
  }

  .table-container {
    background-color: #ffffff;
    border-radius: 4px;
    transition: all 0.3s ease;
    border: 1px solid #d4d4d4;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #d4d4d4;
      background-color: #ffffff;

      span {
        font-size: 14px;
        font-weight: 500;
        color: #303133;

        &.total-info {
          color: #909399;
          font-size: 13px;
        }
      }
    }

    ::v-deep {
      .el-table {
        border: 1px solid #d4d4d4;

        &::before {
          display: none;
        }

        th.el-table__cell {
          background-color: #f5f7fa;
          border-bottom: 1px solid #d4d4d4;
          border-right: 1px solid #d4d4d4;
          transition: background-color 0.3s ease;

          &:hover {
            background-color: #ebeef5;
          }
        }

        td.el-table__cell {
          border-bottom: 1px solid #d4d4d4;
          border-right: 1px solid #d4d4d4;
        }

        .el-table__row {
          transition: background-color 0.3s ease;

          &:hover td {
            background-color: #f5f7fa !important;
          }
        }

        // 固定列样式
        .el-table__fixed,
        .el-table__fixed-right {
          box-shadow: none;
          &::before {
            background-color: #d4d4d4;
          }
        }

        // 空数据样式
        .el-table__empty-block {
          min-height: 200px;
          .el-table__empty-text {
            color: #909399;
          }
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
    background: rgba(144, 147, 153, 0.3);
    border-radius: 4px;
    transition: background 0.3s ease;

    &:hover {
      background: rgba(144, 147, 153, 0.5);
    }
  }

  ::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
}

// 下拉菜单样式
::v-deep {
  .bill-type-dropdown,
  .date-picker-dropdown {
    border-radius: 4px;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .el-select-dropdown__item {
      padding: 8px 20px;
      
      &.selected {
        color: #409EFF;
        font-weight: 600;
      }
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}
</style> 