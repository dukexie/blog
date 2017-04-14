'use strict';
import fs from 'fs';
import path from 'path';

const stats = think.promisify(fs.stat);
/**
 * error controller
 */
export default class extends think.controller.base {
  /**
   * display error page
   * @param  {Number} status []
   * @return {Promise}        []
   */
  async displayError(status) {

    //hide error message on production env
    if(think.env === 'production') {
      this.http.error = null;
    }

    let errorConfig = this.config('error');
    let message = this.http.error && this.http.error.message || '';
    if(this.isJsonp()) {
      return this.jsonp({
        [errorConfig.key]: status,
        [errorConfig.msg]: message
      })
    }else if(this.isAjax()) {
      return this.fail(status, message);
    }

    let file = `common/error/${status}`;

    // 优先尝试主题内的错误文件
    let themeErrorFilePath = path.join(think.ROOT_PATH, `view/${this.http.module}/error/${status}.html`);
    try {
      await stats(themeErrorFilePath);
      file = themeErrorFilePath;
    } catch(e) {
    }

    let options = this.config('tpl');
    options = think.extend({}, options, {type: 'base', file_depr: '_'});
    this.fetch(file, {}, options).then(content => {
      content = content.replace('ERROR_MESSAGE', message);
      this.status(status);
      this.type(options.content_type);
      this.end(content);
    });
  }
  /**
   * Bad Request
   * @return {Promise} []
   */
  async _400Action() {
    return await this.displayError(400);
  }
  /**
   * Forbidden
   * @return {Promise} []
   */
  async _403Action() {
    return await this.displayError(403);
  }
  /**
   * Not Found
   * @return {Promise}      []
   */
  async _404Action() {
    //管理端
    if(this.http.module === 'admin' && !this.isAjax()) {
      let controller = this.controller('admin/base');
      this.status(200);
      return controller.invoke('__call');
    }
    return await this.displayError(404);
  }
  /**
   * Internal Server Error
   * @return {Promise}      []
   */
  async _500Action() {
    return await this.displayError(500);
  }
  /**
   * Service Unavailable
   * @return {Promise}      []
   */
  async _503Action() {
    return await this.displayError(503);
  }
}
