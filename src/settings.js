module.exports = {
  title: 'Vue Element Admin',
  /**
   * @type {string}
   * @description API host address
   */
  host: 'http://192.168.1.200:8000',
  /**
   * @type {boolean} true | false
   * @description Whether show the settings right-panel
   */
  showSettings: true,

  /**
   * @type {boolean} true | false
   * @description Whether need tagsView
   */
  tagsView: true,

  /**
   * @type {boolean} true | false
   * @description Whether fix the header
   */
  fixedHeader: false,

  /**
   * @type {boolean} true | false
   * @description Whether show the logo in sidebar
   */
  sidebarLogo: false,

  /**
   * @type {string | array} 'production' | ['production', 'development']
   * @description Need show err logs component.
   * The default is only used in the production env
   * If you want to also use it in dev, you can pass ['production', 'development']
   */
  errorLog: 'production',

  /**
   * @type {string}
   * @description Base api url
   */
  baseApi: process.env.VUE_APP_BASE_API || '/dev-api',

  /**
   * @type {boolean}
   * @description Whether need permission control
   */
  needPermission: true
}
