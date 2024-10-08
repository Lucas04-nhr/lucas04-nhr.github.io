L2Dwidget.init(
    {
        "model": {
            jsonPath: "https://unpkg.com/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json",
            "scale": 1
        },
        "display": {
            "position": "right", //模型的表现位置
            "width": 150, //模型的宽度
            "height": 300, //模型的高度
            "hOffset": 50,
            "vOffset": -50
        },
        "mobile": {
            "show": false,
            "scale": 0.5
        },
        "react": {
            "opacityDefault": 0.7, //模型默认透明度
            "opacityOnHover": 0.2
        }
    }
);