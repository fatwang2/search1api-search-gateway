```
npm install
npm run dev
```

```
npm run deploy
```

src/
├── index.ts                 # 入口文件
├── config.ts                # 配置文件
├── types/                   # 类型定义
│   └── index.ts             # 通用类型定义
├── middleware/              # 中间件
│   ├── auth.ts              # 认证中间件
│   ├── ratelimit.ts         # 限流中间件
│   ├── cache.ts             # 缓存中间件
│   ├── timeout.ts           # 超时中间件
│   ├── error-handler.ts     # 错误处理中间件
│   └── index.ts             # 中间件导出
├── utils/                   # 工具函数
│   ├── request.ts           # 请求相关工具
│   ├── response.ts          # 响应相关工具
│   └── logger.ts            # 日志工具
└── routes/                  # 路由定义
    ├── index.ts             # 路由汇总
    ├── router1.ts           # 路由 1
    └── router2.ts           # 路由 2