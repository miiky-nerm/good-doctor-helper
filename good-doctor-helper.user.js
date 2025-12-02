// ==UserScript==
// @name         🥇【好医生小助手】无人值守|自动静音|视频助手|考试助手|解禁调试
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  ❌倍速播放✅屏蔽广告✅解禁调试✅视频助手✅考试助手(遍历试错)✅双模选择：只看不考、全看遂考🚑如果要与我交流，则需移步到下载本脚本的页面，在“反馈”区留下意见或直接私信我。
// @author       Miiky
// @license      MIT License
// @match        https://www.cmechina.net/cme/*
// @match        https://www.cmechina.net/cme/exam.jsp*
// @match        https://www.cmechina.net/cme/examQuizFail*
// @match        https://www.cmechina.net/cme/examQuizPass*
// @match        https://www.cmechina.net/cme/course.jsp?course_id*
// @match        https://www.cmechina.net/pub/tongzhi.jsp*
// @match        https://www.cmechina.net/webcam/ewmface2.jsp*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @grant        unsafeWindow
// @antifeature  Donate听说含捐赠功能需要添加此代码（无任何作用）
// @downloadURL https://raw.githubusercontent.com/miiky-nerm/good-doctor-helper/blob/main/good-doctor-helper.user.js
// @updateURL https://raw.githubusercontent.com/miiky-nerm/good-doctor-helper/blob/main/good-doctor-helper.user.js
// ==/UserScript==

var newupdate = "2025.12.2 \n尝试实现脚本后台运行播放功能。\n目前应该各项功能全了，后续有问题再说吧。\n江湖路远 有缘再见😜";

//更新历史
//■2025.11.12 1.再次同步网站更新修复自动考试并加入多重检测。2.对原作者代码进行重构。3.修复4个导致代码崩溃的问题。
//■2025.10.15 1.修复偶发性的脚本闪退。2.移除二维码捐赠界面和其他脚本链接界面。3.加入2倍速代码，固定最高只能2倍速，再高会被检测到。
//■2025.7.9自动考试功能已经恢复。2.多选题目前还没有很好的办法。3.倍速播放功能还在测试中。
//■2025.6.12原作者断更啦，无奈只能自己接手啦，代码还不熟，先改着能刷视频吧。
//■2024.9.19去掉了签到的定时器
//■2024.7.23修改答题逻辑并增加多选题
//■2024.7.8放大人脸识别二维码，方便用户扫描，并提示二维码过期
//■2024.5.31根据平台要求修改答题逻辑
//■2023.12.1创建脚本，支持视频学习及自动考试


(function () {

    var url = window.location.href;
    advis();//广告和操作平台
    // 替换原来的 window.onload 部分
    if (url.indexOf("https://www.cmechina.net/cme/polyv") != -1 || url.indexOf("https://www.cmechina.net/cme/study2.jsp") != -1) {
        console.log("进入好医生课程");

        // 使用 MutationObserver 监听 DOM 变化，确保课程列表加载完成
        function waitForCourseContainer() {
            return new Promise((resolve) => {
                // 先尝试直接获取
                let container = document.querySelector("ul[id='s_r_ml']") || document.getElementById("s_r_ml");
                if (container) {
                    console.log("脚本调试断点48 - 直接找到容器");
                    resolve(container);
                    return;
                }

                // 如果没找到，使用 MutationObserver 监听
                const observer = new MutationObserver((mutations) => {
                    container = document.querySelector("ul[id='s_r_ml']") || document.getElementById("s_r_ml");
                    if (container) {
                        observer.disconnect();
                        console.log("脚本调试断点48 - 监听到容器出现");
                        resolve(container);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // 设置超时，防止无限等待
                setTimeout(() => {
                    observer.disconnect();
                    console.warn("等待课程容器超时");
                    resolve(null);
                }, 30000); // 30秒超时
            });
        }

        async function initCoursePage() {
            // 移除右键菜单禁用
            document.oncontextmenu = null;

            // 移除F12禁用
            document.onkeydown = null;
            document.onkeyup = null;
            document.onkeypress = null;

            var infoold = console.info;//保存以前的console.info以防万一
            console.info = function () { };//禁止提示错误信息
            console.clear = function () { };//禁止清空控制台

            // 等待课程容器加载
            const kechengContainer = await waitForCourseContainer();

            if (!kechengContainer) {
                console.log("未找到课程容器元素，等待5秒后重试");
                setTimeout(initCoursePage, 5000);
                return;
            }

            // 课程容器已加载，继续执行原有逻辑
            try {
                var kecheng = kechengContainer.querySelectorAll("li");
                if (!kecheng || kecheng.length === 0) {
                    console.log("未找到课程列表，等待2秒后重试");
                    setTimeout(initCoursePage, 2000);
                    return;
                }

                console.log("找到课程列表，数量:", kecheng.length);
            } catch (e) {
                console.log("脚本调试断点74");
                kecheng = kechengContainer.querySelectorAll("li");
            };

            let i = 0;
            let foundUnlearned = false;

            while (i < kecheng.length) {
                if (kecheng[i].outerText.includes("未学习") == true) {
                    console.log("找到未学习课程:", kecheng[i].outerText.replace("未学习", ""));

                    if (kecheng[i].className == "active") {
                        // 当前已经是激活状态
                        console.log("课程已激活，开始播放");
                        handleVideoPlayback();
                        foundUnlearned = true;
                        break;
                    } else {
                        // 点击未学习课程
                        console.log("点击未学习课程");
                        kecheng[i].querySelector("a").click();

                        // 等待课程加载，然后设置播放器
                        setTimeout(() => {
                            setupVideoPlayer();
                        }, 3000); // 等待3秒让视频加载

                        foundUnlearned = true;
                        break;
                    }
                }
                i++;
            }

            // 如果没有找到未学习课程
            if (!foundUnlearned) {
                console.log("脚本调试定位117 - 所有课程已完成");
                if (localStorage.getItem("mode") == "2") {
                    setTimeout(function () {
                        clickExamButtonWithRetry();
                    }, 800);
                } else {
                    alert("已经完成全部学习，请自行考试");
                };
            }

            // 启动播放时间监控
            setTimeout(function () {
                const videoMonitor = setInterval(function () {
                    counttime();
                }, 10000);

                // 保存interval以便清理
                window.videoMonitorInterval = videoMonitor;
            }, 5000);
        }

        // 视频播放处理函数
        function handleVideoPlayback() {
            setTimeout(function() {
                try {
                    cc_js_Player.play();
                    cc_js_Player.setVolume(0);
                    console.log("自动播放已启动，音量设为0");
                } catch (error) {
                    console.log("尝试传统播放方式");
                    const video = document.querySelector("video");
                    if (video) {
                        video.play();
                        video.muted = true;
                        video.volume = 0;
                    }
                }
            }, 1000);
        }

        // 设置视频播放器回调
        function setupVideoPlayer() {
            // 设置播放器初始化回调
            window.s2j_onPlayerInitOver = function() {
                console.log("PV视频加载完毕，准备播放");
                setTimeout(function() {
                    try {
                        cc_js_Player.play();
                        cc_js_Player.setVolume(0);
                        console.log("运行了这个事件");
                    } catch (error) {
                        console.log("传统播放器方式");
                        const video = document.querySelector("video");
                        if (video) {
                            video.play();
                            video.muted = true;
                            video.volume = 0;
                        }
                    }
                }, 3000); // 延迟3秒操作
            };

            // 如果播放器已经初始化，直接尝试播放
            setTimeout(handleVideoPlayback, 2000);
        }

        // 页面加载完成后开始初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCoursePage);
        } else {
            // 如果页面已经加载完成，直接初始化
            setTimeout(initCoursePage, 1000);
        }
    } else if (url.indexOf("https://www.cmechina.net/cme/exam.jsp") != -1 && localStorage.getItem("mode") == "2") {
        //这里是考试页面
        let timu = document.querySelectorAll("li");//获取全部考题
        var cishu = localStorage.getItem("cishu");
        var answerData = localStorage.getItem("AnswerData");

        console.log("提取的答案数据：" + answerData);
        console.log("次数：" + cishu);

        // 解析答案数据
        var answerMap = {};
        if (answerData) {
            try {
                answerMap = JSON.parse(answerData);
            } catch (e) {
                console.log("解析答案数据失败，重新开始");
                answerMap = {};
            }
        }

        var i = 0;//用于遍历题号

        while (i < timu.length) {
            var questionElement = timu[i];
            var questionText = questionElement.querySelector("h3.name").innerText;

            // 提取题目key
            var questionKey = extractQuestionKey(questionText);

            // 获取该题目的选项数量
            var radioOptions = questionElement.querySelectorAll("input[type='radio']");
            var checkboxOptions = questionElement.querySelectorAll("input[type='checkbox']");
            var optionCount = Math.max(radioOptions.length, checkboxOptions.length);

            console.log("处理题目：" + questionKey + "，选项数量：" + optionCount);

            if (!answerMap[questionKey]) {
                // 新题目，初始化答案
                if (questionText.indexOf("多选") != -1 || checkboxOptions.length > 0) {
                    // 多选题全选
                    answerMap[questionKey] = "全选";
                    checkboxOptions.forEach(function (checkbox) {
                        checkbox.checked = true;
                    });
                    console.log("新多选题，设置全选");
                } else {
                    // 单选题先选A
                    answerMap[questionKey] = "A";
                    if (radioOptions.length > 0) {
                        radioOptions[0].click();
                    }
                    console.log("新单选题，设置答案：A");
                }
            } else {
                // 有历史答案
                if (questionText.indexOf("多选") != -1 || checkboxOptions.length > 0) {
                    // 多选题全选
                    checkboxOptions.forEach(function (checkbox) {
                        checkbox.checked = true;
                    });
                    console.log("多选题，使用全选");
                } else {
                    // 单选题使用历史答案
                    var answerIndex = thxx(answerMap[questionKey]);
                    // 确保索引在有效范围内
                    if (answerIndex >= optionCount) {
                        answerIndex = 0; // 如果索引超出选项数量，选A
                        answerMap[questionKey] = "A";
                        console.log("答案索引超出选项范围，重置为A");
                    }

                    if (radioOptions.length > answerIndex) {
                        radioOptions[answerIndex].click();
                        console.log("使用历史答案：" + answerMap[questionKey] + " -> 索引：" + answerIndex);
                    } else {
                        // 索引超出范围，选A
                        radioOptions[0].click();
                        answerMap[questionKey] = "A";
                        console.log("答案索引超出，重置为A");
                    }
                }
            }

            i++;
        }

        // 保存更新后的答案映射
        localStorage.setItem("AnswerData", JSON.stringify(answerMap));
        localStorage.setItem("cishu", parseInt(cishu || 0) + 1);

        if (cishu > 11) {
            cleanKeyStorage();
            const userConfirmed = confirm("答案超出脚本能力范围，是否继续执行脚本？");
            if (userConfirmed) {
                console.log("用户选择继续，执行后续代码");
                localStorage.setItem("cishu", 1);
            } else {
                console.log("用户选择取消，停止执行");
                localStorage.setItem("mode", "1");
                return;
            }
        }

        setTimeout(function () {
            document.querySelector("a[id='tjkj']").click();//提交答案按钮
        }, 1000);

    } else if (url.indexOf("https://www.cmechina.net/cme/examQuizFail") != -1 && localStorage.getItem("mode") == "2") {
        //答题失败了
        const extractedList = url.match(/error_order=([0-9,]+)/)[1].split(",");//错题列表
        console.log("错题题号" + extractedList);

        // 获取所有题目元素
        var questionElements = document.querySelectorAll("li.answer_list");
        var answerMap = JSON.parse(localStorage.getItem("AnswerData") || "{}");

        var i = 0;
        while (i < extractedList.length) {
            var errorIndex = parseInt(extractedList[i]) - 1;
            if (questionElements[errorIndex]) {
                var questionText = questionElements[errorIndex].querySelector("h3").innerText;

                // 改进的key提取：先去掉"您的答案"等额外信息
                var cleanQuestionText = questionText.split('您的答案')[0].split('您的回答')[0].split('？')[0].split('?')[0].trim();

                // 使用相同的key提取逻辑
                var questionKey = extractQuestionKey(cleanQuestionText);

                var currentAnswer = answerMap[questionKey];
                console.log("处理错题：" + questionKey + " 当前答案：" + currentAnswer);

                if (currentAnswer && currentAnswer !== "全选" && currentAnswer.length === 1) {
                    // 单选题：将当前答案切换到下一个选项，考虑E选项
                    var currentIndex = thxx(currentAnswer);
                    var newAnswerIndex = (currentIndex + 1) % 5; // A->B->C->D->E->A，最多5个选项
                    answerMap[questionKey] = fthxx(newAnswerIndex);
                    console.log("错题修正：" + questionKey + " " + currentAnswer + " -> " + answerMap[questionKey]);
                } else if (currentAnswer === "全选") {
                    // 多选题保持全选
                    console.log("多选题保持全选策略");
                } else {
                    // 其他情况，重置为A
                    answerMap[questionKey] = "A";
                    console.log("重置答案为A");
                }
            }
            i++;
        };

        localStorage.setItem("AnswerData", JSON.stringify(answerMap));
        console.log("更新后的答案映射", answerMap);

        setTimeout(function () {
            document.querySelector("a[id='cxdt']").click();//重新答题
        }, 500);

    } else if (url.indexOf("https://www.cmechina.net/cme/examQuizPass") != -1) {
        //答题成功
        cleanKeyStorage();
        setTimeout(function () {
            document.querySelector("div[class='show_exam_btns']").querySelector("a").click();//调到下一个章节的考试
        }, 2000);
    } else if (url.indexOf("https://www.cmechina.net/cme/course.jsp?course_id") != -1) {

        try {
            document.querySelector("i[class='fa fa-circle-o']").click()//课程页面点击未学习的进入
        } catch (error) {
            if (localStorage.getItem("mode") == "2") {
                document.querySelector("i[class='fa fa-adjust']").click();//课程页面点击要考试的进入
            };

        };

    } else if (url.indexOf("https://www.cmechina.net/cme/apply.jsp?course_id") != -1) {
        setTimeout(function () {
            const applyLink = document.querySelector("a[class*='bg-lv']");
            if (applyLink) {
                applyLink.click();
                console.log("成功点击申请学分链接");
            } else {
                console.log("未找到申请学分链接");
            };
            cleanKeyStorage();
        }, 500);
    } else if (url.indexOf("https://www.cmechina.net/pub/tongzhi.jsp") != -1) {
        //网站的广告通知，直接给他点掉。
        setTimeout(function () {
            try {
                document.querySelector("a[class='newBtn']").click();
            } catch (error) {
                console.log("没有找到推广通知");
            };
        }, 1000);
    } else if (url.indexOf("https://www.cmechina.net/cme/index.jsp") != -1) {
        setTimeout(function () {
            try {
                document.querySelector("div[class='close2']").click();
            } catch (error) {
                console.log("没有找到首页广告");
            };
        }, 1000);
    } else if (url.indexOf("https://www.cmechina.net/webcam/ewmface2.jsp") != -1) {
        console.log("二维码页面");
        var code = setInterval(function () {
            document.querySelector("div[id='wx_pay_ewm']").querySelector("canvas").style = "position:relative;left:-60px;top:-100px;height:300px;width:300px";
            if (document.querySelector("div[id='wx_pay_ewm']").querySelector("canvas").style["height"] == "300px") {
                clearInterval(code);
            };
        }, 100);
        setTimeout(function () {
            let nihao = document.createElement("div");
            nihao.innerText = "二维码已失效，点此刷新";
            nihao.style = "position:relative;top:-270px;left:-35px;width:250px;font-size:22px;text-align:left;color: #ff0000;font-weight: bold;background-color: #FFFFFF"
            document.querySelector("div[id='wx_pay_ewm']").querySelector("canvas").parentNode.append(nihao);
            nihao.onclick = function () {
                location.reload();
            };
        }, 60000);
    } else if (url.indexOf("https://www.cmechina.net/cme/examCoursePass.jsp") != -1) {
        setTimeout(function () {
            const applyLink = document.querySelector("a[href*='apply.jsp'][href*='course_id']");
            if (applyLink) {
                applyLink.click();
                console.log("成功点击申请学分链接");
            } else {
                console.log("未找到申请学分链接");
            };
            cleanKeyStorage();
        }, 500);
    };

    //---------------------------------防止检测区------------------------------//
    //创建完美的事件对象
    function createPerfectEvent(type, target = document.body) {
        try {
            if (type === 'mousemove') {
                return new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    target: target,
                    relatedTarget: target,
                    clientX: Math.random() * window.innerWidth,
                    clientY: Math.random() * window.innerHeight,
                    screenX: Math.random() * screen.width,
                    screenY: Math.random() * screen.height
                });
            }
            return new Event(type, { bubbles: true, cancelable: true });
        } catch (e) {
            const event = document.createEvent('Event');
            event.initEvent(type, true, true);
            return event;
        }
    };

    //智能活动模拟
    function simulateIntelligentActivity() {
        const targets = [document.body, document.documentElement];

        // 模拟鼠标移动
        targets.forEach(target => {
            target.dispatchEvent(createPerfectEvent('mousemove', target));
        });

        // 模拟键盘活动
        const keyEvent = new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' });
        document.dispatchEvent(keyEvent);

        // 模拟微滚动
        window.dispatchEvent(new Event('scroll'));

        // 模拟网络活动
        if (typeof XMLHttpRequest !== 'undefined') {
            const oldSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function() {
                this.dispatchEvent(new Event('progress'));
                oldSend.apply(this, arguments);
            };
        }
    };

    // ========== 反检测系统 ==========

    // 1. 检测并绕过性能API监控
    if (window.performance && performance.now) {
        const originalNow = performance.now;
        performance.now = function() {
            return originalNow.call(performance);
        };
    }

    // 2. 绕过Web Worker检测
    if (window.Worker) {
        const originalWorker = window.Worker;
        window.Worker = function() {
            const worker = new originalWorker(...arguments);
            worker.postMessage = function() {}; // 禁用通信
            return worker;
        };
    }

    // 3. 随机定时器系统
    let activityInterval = setInterval(() => {
        simulateIntelligentActivity();
    }, 15000 + Math.random() * 15000); // 15-30秒随机间隔

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        clearInterval(activityInterval);
    });

    // ========== 初始化 ==========

    console.log('终极防后台检测系统已激活');
    //---------------------------------防止检测区end------------------------------//

    //---------------------------------全局函数区------------------------------//

    function thxx(xx) {
        switch (xx) {
            case "A":
                xx = 0;
                break;
            case "B":
                xx = 1;
                break;
            case "C":
                xx = 2;
                break;
            case "D":
                xx = 3;
                break;
            case "E":
                xx = 4;
                break;
            default:
                xx = 0; // 默认选A
                break;
        };
        return xx;
    };
    function extractQuestionKey(questionText) {
        // 先去掉"您的答案"等答题失败页面的额外信息
        var key = questionText.split('您的答案')[0].split('您的回答')[0];

        // 去掉【单选】、【多选】标记
        key = key.replace(/【单选】|【多选】/g, "");

        // 去掉开头的数字和点（如"1."、"2."等）
        key = key.replace(/^\d+\.\s*/, "");

        // 去掉其他可能的序号格式（如"1、"等）
        key = key.replace(/^\d+、\s*/, "");

        // 去掉换行符和其他空白字符
        key = key.replace(/\n/g, "").replace(/\s+/g, " ");
        key = key.split('？')[0].split('?')[0];

        // 去除首尾空格
        key = key.trim();

        console.log("提取题目key: '" + questionText + "' -> '" + key + "'");

        return key;
    };
    function fthxx(xx) {
        switch (xx) {
            case 0:
                xx = "A";
                break;
            case 1:
                xx = "B";
                break;
            case 2:
                xx = "C";
                break;
            case 3:
                xx = "D";
                break;
            case 4:
                xx = "E";
                break;
            default:
                xx = "A"; // 默认返回A
                break;
        };
        return xx;
    };

    //缓存清理
    function cleanKeyStorage() {
        localStorage.removeItem("cishu");
        localStorage.removeItem("Answer");
        localStorage.removeItem("AnswerData");
    };

    //网页左侧脚本界面浮窗
    function advis() {
        let div1 = document.createElement("div");
        div1.innerHTML = `
    <div id='Div1' style="max-width:220px;text-align:left;padding: 10px 10px;font-size: 20px;float: left;position:fixed;top:180px;left: 10px;z-index: 99999; background-color: rgba(184, 247, 255, 0.7); overflow-x: auto;">
    <span id='clo' style="float: right;position: absolute;top:14px;right:5px;cursor:pointer;font-size:16px">❎</span>
    <div style="font-size:22px;font-weight:bold;color:red;">好医生小助手`+ GM_info['script']['version'] + `</div> 
    <hr style="margin-top: 10px;margin-bottom: 10px;">
    <a id='Autocourse' class="btn btn-default">★只看不考</a><br>
    <a id='Joincourse' class="btn btn-default">★全看遂考</a><br><br>
    
    <span style="font-size:18px;font-weight:bold;color:black;">其他脚本</span><br>
    <a class='spe' style="font-size:16px;font-weight:normal;color:black;white-space:pre-wrap;">😁</a>
    <a id='update' class='spe' style="font-size:14px;font-weight:normal;color:black;white-space:pre-wrap;">最近更新:<br>`+ newupdate + `</a><br>
    </div> `;
        //<input type="text" id="token" style="width: 130px;" value="`+ GM_getValue("tikutoken") + `"></input>
        // <a id='Getlicense' class="btn btn-default">★获取授权</a>
        document.body.append(div1);
        let mode1 = document.querySelector("a[id='Autocourse']");
        let mode2 = document.querySelector("a[id='Joincourse']");
        // 初始化模式状态
        if (mode1 && mode2) {
            let currentMode = localStorage.getItem("mode");
            if (currentMode === null || currentMode === "" || currentMode === "1") {
                mode1.innerHTML = "★只看不考 ✅";
                mode2.innerHTML = "★全看遂考";
                localStorage.setItem("mode", "1"); // 确保有默认值
            } else {
                mode1.innerHTML = "★只看不考";
                mode2.innerHTML = "★全看遂考 ✅";
            }

            mode1.onclick = function () {
                // 使用 includes 来检查文本内容，避免空格问题
                if (mode1.innerHTML.includes("★只看不考") && !mode1.innerHTML.includes("✅")) {
                    mode1.innerHTML = "★只看不考 ✅";
                    mode2.innerHTML = "★全看遂考";
                    localStorage.setItem("mode", "1");
                }
            };

            mode2.onclick = function () {
                if (mode2.innerHTML.includes("★全看遂考") && !mode2.innerHTML.includes("✅")) {
                    mode1.innerHTML = "★只看不考";
                    mode2.innerHTML = "★全看遂考 ✅";
                    localStorage.setItem("mode", "2");
                }
            };
        } else {
            console.warn('模式选择按钮未找到，跳过初始化');
            const currentMode = localStorage.getItem("mode") || "1";
        }
        clo.onclick = function () {
            document.querySelector("div[id='Div1']").style.display = "none";
        };
    };
    //播放时间统计和调速
    function counttime() {
        if (typeof intervalPause !== 'undefined') {
            clearInterval(intervalPause); //去掉签到定时器
        }
        if (typeof pauseSecond !== 'undefined') {
            pauseSecond = -1; //去掉签到定时器
        }
        function openPause() { };//清空弹出签到的功能
        try {
            var currenttime = parseInt(cc_js_Player.getPosition());
            var duration = parseInt(cc_js_Player.getDuration());
            var percent = ((currenttime / duration) * 100).toFixed(2) + "%";

            if (currenttime == duration) {
                console.log("已播放" + percent);
                // 立即刷新页面
                setTimeout(function() {
                    console.log("已结束播放，等待后台数据同步后刷新网页");
                    location.reload();
                }, 15000); // 15秒后刷新，确保状态已更新
            } else {
                console.log("已播放" + percent);
                cc_js_Player.play();
                cc_js_Player.setVolume(0);

                var activeLink = document.querySelector("a[class='active']");
                if (activeLink) {
                    document.title = "【" + percent + "】" + activeLink.textContent;
                }
            }
        } catch (error) {
            console.error("播放器操作出错:", error);
        };
    };
    // 添加新的点击考试按钮函数
    function clickExamButtonWithRetry(maxAttempts = 5, interval = 700) {
        let attempts = 0;

        const tryClick = () => {
            attempts++;

            // 多种选择器组合，确保找到按钮
            const examButton =
                  document.querySelector("a.cur[onclick*='gotoExam']") ||  // 精确匹配
                  document.querySelector("a.cur") ||                       // 类名匹配
                  document.querySelector("a[onclick*='gotoExam']") ||      // 函数名匹配
                  document.querySelector(".s_r_bts a:first-child") ||      // 结构匹配
                  document.querySelector("a[href='#'][onclick]");          // 通用匹配

            console.log(`第 ${attempts} 次尝试，找到按钮:`, examButton);

            if (examButton) {
                console.log("按钮详细信息:", {
                    outerHTML: examButton.outerHTML,
                    onclick: examButton.onclick,
                    classList: examButton.classList,
                    text: examButton.textContent
                });

                // 先尝试直接调用函数（最可靠的方式）
                if (typeof gotoExam === 'function') {
                    console.log("直接调用gotoExam函数");
                    gotoExam();
                    return true;
                }

                // 如果函数不存在，尝试触发onclick事件
                if (examButton.onclick) {
                    console.log("触发onclick事件");
                    examButton.onclick();
                    return true;
                }

                // 最后使用click方法
                console.log("使用click方法");
                examButton.click();
                return true;

            } else if (attempts < maxAttempts) {
                console.log(`第 ${attempts} 次尝试未找到考试按钮，${interval}ms后重试`);
                console.log("当前.s_r_bts容器内容:", document.querySelector('.s_r_bts')?.innerHTML);
                setTimeout(tryClick, interval);
            } else {
                console.error(`在 ${maxAttempts} 次尝试后仍未找到考试按钮`);
                console.log("完整的.s_r_bts容器:", document.querySelector('.s_r_bts'));

                // 最后尝试：直接执行gotoExam函数
                if (typeof gotoExam === 'function') {
                    console.log("最终尝试：直接执行gotoExam函数");
                    gotoExam();
                } else {
                    console.log("gotoExam函数未定义");
                    if (confirm("未找到考试按钮，是否手动点击或刷新页面？")) {
                        location.reload();
                    }
                }
            }
        };

        tryClick();
    };
    //---------------------------------全局函数区end------------------------------//

})();
