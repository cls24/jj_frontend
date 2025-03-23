import Layout from '@/layout'

const materialRouter = {
  path: '/material',
  component: Layout,
  redirect: '/material/list',
  name: 'Material',
  meta: {
    title: '物料管理',
    icon: 'el-icon-goods',
    roles: ['admin'] // 管理员权限
  },
  children: [
    {
      path: 'list',
      component: () => import('@/views/material/index'),
      name: 'MaterialList',
      meta: { 
        title: '物料列表',
        icon: 'el-icon-s-order',
        roles: ['admin']
      }
    }
  ]
}

export default materialRouter 