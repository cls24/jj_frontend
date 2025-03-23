import { Loading } from 'element-ui';
const startLoading = () => {  // 使用Element loading-start 方法
  loading = Loading.service({
    lock: true,
    text: '加载中……',
    background: 'rgba(0, 0, 0, 0.7)'
  });
};

export default startLoading
