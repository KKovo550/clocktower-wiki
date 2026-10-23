# 魔典界面约定

普通功能面板统一使用黑色染色亚光玻璃。视觉参数以 app.css 的 --g-glass-* 为准。

- 新弹窗复用 gDialog 和 g-modal-head／g-modal-body，自动继承默认玻璃材质。
- 新的非弹窗面板复用 g-glass-surface，尺寸和布局另设类名。
- 表单、卡片和工具栏沿用共享控件、内层表面与工具栏变量；手机模糊强度及无 backdrop-filter 时的回退由共享变量处理。
- 玩家身份展示保持不透明：g-signal-dialog、g-signal-player、g-bluff-reveal 和线下抽取展示必须完整遮盖底层魔典，立即盖回私密内容。
- 材质调整保留圆牌图案、角色颜色、布局、滚动和操作行为。
- 缩放后的布局使用 --g-viewport-width／--g-viewport-height 作为视口尺寸。app.js 的 measure、uiWidth／uiHeight 和 pointerX／pointerY 统一使用缩放前的逻辑坐标；新增拖动和弹窗定位沿用这些接口。
- 新功能动画复用 app.js 的 playMotion／contentArrive，快速操作替换旧动画并响应系统减少动态效果。仅动画化内容透明度或图案，布局和指针坐标立即更新；线下身份可只翻转当前圆牌图案，盖回同步清除旧身份，不保留旧角色画面的过渡层。

新增面板后检查桌面和触屏尺寸，并确认未给身份展示页引入透明或淡入效果。
