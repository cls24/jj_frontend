import request from "@/utils/request";
import {host} from "@/settings";

export function addshopingcart(data) {
  return request({
    url: host+'addshopingcart/batchAdd',
    method: 'post',
    data
  })
}
