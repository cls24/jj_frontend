import { getMaterialList, addMaterial, updateMaterial, deleteMaterial } from '@/api/material'

const state = {
  materialList: [],
  loading: false
}

const mutations = {
  SET_MATERIAL_LIST: (state, list) => {
    state.materialList = list
  },
  SET_LOADING: (state, status) => {
    state.loading = status
  }
}

const actions = {
  // 获取物料列表
  async getMaterialList({ commit }) {
    try {
      commit('SET_LOADING', true)
      const response = await getMaterialList()
      console.log('Material List Response:', response) // 调试用
      if (response && response.code === 1) {
        commit('SET_MATERIAL_LIST', response.data)
        console.log('Material List Data:', response.data) // 调试用
      } else {
        throw new Error(response.message || '获取数据失败')
      }
      return response
    } catch (error) {
      console.error('Get Material List Error:', error)
      commit('SET_MATERIAL_LIST', []) // 出错时清空列表
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // 添加物料
  async addMaterial({ dispatch }, data) {
    const response = await addMaterial(data)
    await dispatch('getMaterialList')
    return response
  },

  // 更新物料
  async updateMaterial({ dispatch }, data) {
    const response = await updateMaterial(data)
    await dispatch('getMaterialList')
    return response
  },

  // 删除物料
  async deleteMaterial({ dispatch }, id) {
    const response = await deleteMaterial(id)
    await dispatch('getMaterialList')
    return response
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
} 