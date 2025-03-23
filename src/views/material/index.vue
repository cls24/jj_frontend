<template>
  <div class="app-container">
    <div class="filter-container">
      <!-- 上传图片按钮 -->
      <el-upload
        class="upload-btn"
        action="#"
        :show-file-list="false"
        :http-request="handleUpload"
        accept="image/*"
        :before-upload="beforeUpload"
      >
        <el-button 
          type="primary" 
          icon="el-icon-upload"
          :loading="uploadLoading"
        >
          {{ uploadLoading ? '上传中...' : '上传图片' }}
        </el-button>
      </el-upload>
    </div>

    <!-- 表格内容 -->
    <el-table
      v-loading="loading"
      :data="materialList"
      border
      style="width: 100%"
    >
      <!-- 添加空数据提示 -->
      <template slot="empty">
        <el-empty 
          description="暂无数据"
          :image-size="100"
        ></el-empty>
      </template>

      <el-table-column
        prop="id"
        label="ID"
        width="80"
        align="center"
      />
      
      <el-table-column
        prop="pfullname"
        label="物料名称"
        min-width="200"
        show-overflow-tooltip
      />
      
      <el-table-column
        prop="SerialNumber"
        label="序列号"
        width="180"
        align="center"
      />
      
      <el-table-column
        prop="quality"
        label="成色"
        width="100"
        align="center"
      >
        <template slot-scope="scope">
          {{ (scope.row.quality * 100).toFixed(0) + '%' }}
        </template>
      </el-table-column>
      
      <el-table-column
        prop="created_at"
        label="创建时间"
        width="160"
        align="center"
      />

      <!-- 图片列 -->
      <el-table-column
        label="图片"
        width="100"
        align="center"
      >
        <template slot-scope="scope">
          <el-image
            v-if="scope.row.imageUrl"
            :src="scope.row.imageUrl"
            :preview-src-list="[scope.row.imageUrl]"
            fit="contain"
            style="width: 50px; height: 50px"
            class="fade-in"
          >
            <div slot="error" class="image-slot">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { uploadImage } from '@/api/material'
import { Message } from 'element-ui'

export default {
  name: 'MaterialManagement',
  data() {
    return {
      // 查询参数
      queryParams: {
        keyword: '',
        dateRange: [],
        condition: '',
        page: 1,
        pageSize: 10
      },
      // 物料成色选项
      conditionOptions: [
        { value: '全新', label: '全新' },
        { value: '九成新', label: '九成新' },
        { value: '八成新', label: '八成新' },
        { value: '七成新', label: '七成新' },
        { value: '六成新及以下', label: '六成新及以下' }
      ],
      uploadLoading: false,
      fullscreenLoading: false
    }
  },
  computed: {
    ...mapState('material', {
      materialList: state => state.materialList,
      loading: state => state.loading
    })
  },
  created() {
    console.log('Component created')
    this.loadData()
  },
  methods: {
    ...mapActions('material', ['getMaterialList']),
    async loadData() {
      try {
        console.log('Loading data...')
        await this.getMaterialList()
        console.log('Data loaded:', this.materialList)
      } catch (error) {
        console.error('Load data error:', error)
        this.$message.error('加载数据失败，请刷新重试')
      }
    },
    // 获取表格数据
    async fetchData() {
      await this.loadData()
    },
    // 搜索
    handleSearch() {
      this.queryParams.page = 1
      this.fetchData()
    },
    // 重置
    handleReset() {
      this.queryParams = {
        keyword: '',
        dateRange: [],
        condition: '',
        page: 1,
        pageSize: 10
      }
      this.fetchData()
    },
    // 改变每页显示数量
    handleSizeChange(val) {
      this.queryParams.pageSize = val
      this.fetchData()
    },
    // 改变页码
    handleCurrentChange(val) {
      this.queryParams.page = val
      this.fetchData()
    },
    // 处理图片上传
    async handleUpload({ file }) {
      try {
        this.uploadLoading = true
        this.fullscreenLoading = true

        const formData = new FormData()
        formData.append('file', file)
        
        const response = await uploadImage(formData)
        if (response.code === 200) {
          this.$notify({
            title: '成功',
            message: '上传成功',
            type: 'success',
            duration: 3000,
            position: 'bottom-right'
          })
          // 刷新列表
          await this.getMaterialList()
        } else {
          this.$notify({
            title: '上传失败',
            message: response.message || '图片上传失败，请重试',
            type: 'error',
            duration: 3000,
            position: 'bottom-right'
          })
        }
      } catch (error) {
        console.error('上传图片失败:', error)
        this.$notify({
          title: '系统错误',
          message: '上传过程中发生错误，请稍后重试',
          type: 'error',
          duration: 3000,
          position: 'bottom-right'
        })
      } finally {
        this.uploadLoading = false
        this.fullscreenLoading = false
      }
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .filter-container {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;

    .upload-btn {
      margin-left: 10px;
      
      ::v-deep .el-upload {
        display: block;
      }
    }
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
    font-size: 20px;
  }

  .el-image {
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409EFF;
      transform: scale(1.05);
    }
  }

  .fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.el-loading-mask {
  transition: opacity 0.3s;
}
</style> 