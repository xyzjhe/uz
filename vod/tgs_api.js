//@name:[盘] TG免代纯搜
//@version:1
//@webSite:网盘资源综合@yunpansall
//@env:TG搜API地址##TG搜索API地址，默认: http://tgsou.fish2018.ip-ddns.com
//@remark:格式 频道名称1@频道id1&频道名称2@频道id2，使用聚合搜索API，支持群组搜索
//@order: B

// ignore
// 不支持导入，这里只是本地开发用于代码提示
// 如需添加通用依赖，请联系 https://t.me/uzVideoAppbot
import {
    FilterLabel,
    FilterTitle,
    VideoClass,
    VideoSubclass,
    VideoDetail,
    RepVideoClassList,
    RepVideoSubclassList,
    RepVideoList,
    RepVideoDetail,
    RepVideoPlayUrl,
    UZArgs,
    UZSubclassVideoListArgs,
} from '../../core/core/uzVideo.js'

import {
    UZUtils,
    ProData,
    ReqResponseType,
    ReqAddressType,
    req,
    getEnv,
    setEnv,
    goToVerify,
    openWebToBindEnv,
    toast,
    kIsDesktop,
    kIsAndroid,
    kIsIOS,
    kIsWindows,
    kIsMacOS,
    kIsTV,
    kLocale,
    kAppVersion,
    formatBackData,
} from '../../core/core/uzUtils.js'

import { cheerio, Crypto, Encrypt, JSONbig } from '../../core/core/uz3lib.js'
// ignore

const appConfig = {
    _webSite: '网盘资源综合@yunpansall',
    /**
     * 网站主页，uz 调用每个函数前都会进行赋值操作
     * 如果不想被改变 请自定义一个变量
     */
    get webSite() {
        return this._webSite
    },
    set webSite(value) {
        this._webSite = value
    },

    // TG搜索API地址，替代原来的 t.me/s/
    tgs: 'http://tgsou.fish2018.ip-ddns.com',

    _uzTag: '',
    /**
     * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
     * 用于读取环境变量
     */
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
}

// --- 全局常量/配置 ---
// 统一的网盘配置 - 单一数据源
const CLOUD_PROVIDERS = {
    tianyi: {
        name: '天翼',
        domains: ['189.cn']
    },
    quark: {
        name: '夸克',
        domains: ['pan.quark.cn']
    },
    uc: {
        name: 'UC',
        domains: ['drive.uc.cn']
    },
    ali: {
        name: '阿里',
        domains: ['alipan.com', 'aliyundrive.com']
    },
    pan123: {
        name: '123',
        domains: ['123684.com', '123865.com', '123912.com', '123pan.com', '123pan.cn', '123592.com']
    },
    baidu: {
        name: '百度',
        domains: ['pan.baidu.com']
    },
    y115: {
        name: '115',
        domains: ['115.com']
    }
};

// 从统一配置自动生成所需数组
const panUrlsExt = Object.values(CLOUD_PROVIDERS).flatMap(provider => provider.domains);

// 预编译网盘提供商正则表达式，提高匹配性能
const providerRegexMap = Object.values(CLOUD_PROVIDERS).map(provider => ({
    name: provider.name,
    // 将多个域名组合成一个正则，用 | 分隔，转义点号
    regex: new RegExp(provider.domains.map(domain =>
        domain.replace(/\./g, '\\.')
    ).join('|'), 'i')
}));

// 预编译剧集信息提取正则表达式
const EPISODE_COMBINED_REGEX = /((?:更新至|全|第)\s*\d+\s*集)|((?:更新至|全|第)\s*[一二三四五六七八九十百千万亿]+\s*集)|((?:更至|更)\s*(?:EP)?\s*\d+)/;

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        // 纯搜索版本，不提供分类功能
        // 返回空分类列表
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    try {
        // 纯搜索版本，不提供二级分类功能
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        // 纯搜索版本，不提供分类浏览功能
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类视频列表 或 筛选视频列表
 * @param {UZSubclassVideoListArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    try {
        // 纯搜索版本，不提供筛选功能
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        backData.data = {
            panUrls: JSON.parse(args.url),
        }
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    try {
        // 纯搜索版本，不提供播放功能
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频 - 核心功能
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        // 获取环境变量中的API地址
        var tgsApi = await getEnv(appConfig.uzTag, "TG搜API地址")
        if (tgsApi && tgsApi.length > 0) {
            appConfig.tgs = tgsApi
        }

        // 从配置中提取频道ID列表
        const channelIds = appConfig.webSite.split('&').map((item) => {
            return item.split('@')[1]
        })
        const channelUsername = channelIds.join(',')

        // 构建搜索API请求URL
        const searchUrl = `${appConfig.tgs}?pic=false&count=10&channelUsername=${encodeURIComponent(channelUsername)}&keyword=${encodeURIComponent(args.searchWord)}`
        
        console.log('搜索URL:', searchUrl)
        
        // 调用TG搜索API
        const res = await req(searchUrl)
        
        if (res.data && res.data.results) {
            // 解析API返回的数据
            const videoList = parseAPIResults(res.data.results, args.searchWord)
            
            // 去重处理
            backData.data = deduplicateVideoListByLinks(videoList)
        }
        
    } catch (error) {
        console.error('搜索错误:', error)
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 解析TG搜索API返回的结果
 * @param {Array} results - API返回的results数组
 * @param {string} searchWord - 搜索关键词
 * @returns {Array} 视频列表
 */
function parseAPIResults(results, searchWord) {
    const videoList = []

    // 创建频道名称映射
    const channelMap = new Map()
    appConfig.webSite.split('&').forEach(item => {
        const parts = item.split('@')
        if (parts.length === 2) {
            channelMap.set(parts[1], parts[0]) // 键: id, 值: name
        }
    })

    for (const result of results) {
        if (!result || typeof result !== 'string') continue

        // 解析格式: "频道名$$$链接1$$标题1##链接2$$标题2##..."
        const parts = result.split('$$$')
        if (parts.length !== 2) continue

        const channelName = parts[0]
        const contentStr = parts[1]

        if (!contentStr) continue

        // 解析内容项: "链接1$$标题1##链接2$$标题2##..."
        const items = contentStr.split('##')

        for (const item of items) {
            if (!item.trim()) continue

            const itemParts = item.split('$$')
            let link = itemParts[0]?.trim()
            let title = itemParts[1]?.trim()

            // 如果没有标题，使用搜索关键词
            if (!title) {
                title = searchWord
            }

            // 验证是否为有效的网盘链接
            if (!link || !isValidPanUrl(link)) continue

            // 创建视频对象
            const video = new VideoDetail()
            video.vod_id = JSON.stringify([link])
            video.vod_name = cleanTitle(title)

            // 识别网盘提供商
            const providers = identifyProviders([link])

            // 提取剧集信息
            const episodeInfo = extractEpisodeInfo(title)
            if (episodeInfo) {
                video.vod_name = title.replace(episodeInfo, '').trim()
            }

            // 构建备注
            const remarkParts = []
            if (providers.length > 0) {
                remarkParts.push(providers.join('/'))
            }
            if (channelName && channelName !== '未知频道') {
                remarkParts.push(channelName)
            }
            if (episodeInfo) {
                remarkParts.push(episodeInfo)
            }

            video.vod_remarks = remarkParts.length > 0 ? remarkParts.join('|') : '资源'

            // 设置默认图片
            video.vod_pic = ''

            videoList.push(video)
        }
    }

    return videoList
}

/**
 * 验证是否为有效的网盘URL
 * @param {string} url
 * @returns {boolean}
 */
function isValidPanUrl(url) {
    if (!url || typeof url !== 'string') return false

    for (const domain of panUrlsExt) {
        if (url.includes(domain)) {
            return true
        }
    }
    return false
}

/**
 * 识别网盘提供商
 * @param {Array} urls
 * @returns {Array} 提供商名称数组
 */
function identifyProviders(urls) {
    const providers = new Set()

    for (const url of urls) {
        for (const provider of providerRegexMap) {
            if (provider.regex.test(url)) {
                providers.add(provider.name)
                break
            }
        }
    }

    return Array.from(providers)
}

/**
 * 清理标题
 * @param {string} title
 * @returns {string}
 */
function cleanTitle(title) {
    if (!title) return ''

    return title
        .replace(/^(名称[：:])/, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * 提取剧集信息
 * @param {string} title
 * @returns {string|null}
 */
function extractEpisodeInfo(title) {
    if (!title) return null

    const match = title.match(EPISODE_COMBINED_REGEX)
    return match ? match[0] : null
}

/**
 * 去重函数 - 基于链接去重
 * @param {Array} videoList
 * @returns {Array}
 */
function deduplicateVideoListByLinks(videoList) {
    const map = new Map()

    for (const video of videoList) {
        let ids
        try {
            ids = JSON.parse(video.vod_id || '[]')
            if (!Array.isArray(ids)) {
                ids = []
            }
        } catch (e) {
            ids = []
        }

        // 通过排序后的链接创建唯一键
        const key = JSON.stringify(ids.sort())

        // 如果键不存在，添加到map中
        if (!map.has(key)) {
            map.set(key, video)
        }
    }

    return Array.from(map.values())
}
