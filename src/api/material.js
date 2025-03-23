import request from '@/utils/request'
import settings from '@/settings'
// 获取物料列表
export function getMaterialList() {
  return request({
    url: settings.host + '/materialMnt/list',
    method: 'get',
    headers: {
      'Accept': 'application/json'
    }
  })
}

// 添加物料
export function addMaterial(data) {
  return request({
    url: '/material/add',
    method: 'post',
    data
  })
}

// 更新物料
export function updateMaterial(data) {
  return request({
    url: '/material/update',
    method: 'put',
    data
  })
}

// 删除物料
export function deleteMaterial(id) {
  return request({
    url: `/material/delete/${id}`,
    method: 'delete'
  })
}

// 上传图片
export function uploadImage(data) {
  return request({
    url: settings.host + '/materialMnt/imageUpload',
    method: 'post',
    data,  // 直接传递 FormData 对象
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 