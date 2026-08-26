---
version: alpha
name: "TWD 5e 角色卡"
description: "繁體中文 D&D 角色建立與遊玩輔助的高密度規則介面。"
colors:
  background: "#eef3ff"
  surface: "#ffffff"
  text: "#16213d"
  text-body: "#33415d"
  primary: "#2852d6"
typography:
  sans:
    fontFamily: '"IBM Plex Sans", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif'
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.25rem"
spacing:
  app-gutter: "var(--app-gutter)"
  content-measure: "38rem"
components:
  button:
    backgroundColor: "$colors.primary"
    textColor: "$colors.surface"
    rounded: "$rounded.sm"
  card:
    backgroundColor: "$colors.surface"
    textColor: "$colors.text"
    rounded: "$rounded.lg"
  choice-card:
    backgroundColor: "$colors.background"
    textColor: "$colors.text-body"
    rounded: "$rounded.md"
---

# TWD 5e 角色卡 Design System

## Overview

### Creative North Star

一本能在遊戲桌旁快速翻讀的註記規則書：資訊密度高，但以分段、細線與藍色定位線讓每一條規則可被迅速掃到。

### Product context and register

- **Audience and primary job:** 使用繁體中文規則的 D&D 玩家，需要建立角色、查閱能力並完成選擇。
- **Locale(s) and language policy:** 介面以繁體中文為主；英文專名與數值保留原有規則寫法。
- **Usage scene:** 桌機與手機上反覆查閱；規則說明的可掃讀性優先於裝飾。
- **Register:** Product。
- **Memorable signature:** 已選的規則選項以淡藍表面與左側藍色定位線形成「書頁書籤」感。
- **Restraint:** 表格、選項與規則段落維持平面且緊湊，不加入不承載資訊的圖像或動畫。
- **Anti-references:** 不使用卡片牆或行銷首頁式的大型留白；它們會降低規則比較效率。
- **Token ownership/runtime mapping:** `styles.css` 的 CSS custom properties 是執行期唯一 token 來源；本檔記錄其已實作的意圖與對應值。

## Colors

淺色模式以 `#eef3ff` 作背景、白色半透明表面承載內容，`#16213d` 和 `#33415d` 分別承擔標題與內文。`#2852d6` 是選取、連結與焦點的唯一主要強調色；暗色模式由 `styles.css` 的同名 token 改寫，語意不變。

## Typography

正文使用 IBM Plex Sans 搭配 Noto Sans TC、PingFang TC、Microsoft JhengHei fallback。規則標題以粗體和左側定位線建立層級；正文維持約 1.6 的行距與 38rem 的可讀欄寬。不得以全形、全大寫或過度字重替代層級。

## Layout

區塊以 app gutter 和自然文件捲動排列。職業特性表格擁有自己的橫向捲動容器；規則文字限制於 38rem。可選規則為垂直清單，卡片間距 0.62rem，窄螢幕會移除說明的左縮排以保留有效寬度。

## Elevation & Depth

靜態內容以表面色、邊框和極淡陰影區分，而非浮誇陰影。已選取項目透過色彩與 3px inset 定位線提高層級；不應使用陰影作為唯一選取訊號。

## Shapes

表單與規則卡使用柔和的 `sm`、`md`、`lg` 圓角。分隔線和清單標記以規則內容為導向，不能純粹裝飾。

## Components

### Foundational visual states

互動控制須有可見焦點。選項卡在 hover 時提高邊框對比，選取時同時改變淡色表面、邊框與定位線；停用狀態沿用既有控制元件規則。

### Navigation and data display

規則表格保留可橫向捲動的資料表語意。職業能力以等級區段、子標題和巢狀清單呈現；選項卡的核取方塊保有原生鍵盤操作。

### Content and data visualization

使用直接、規則書式中文：標題命名能力，內容描述效果，不以行銷語氣取代規則。數值、環階和技能名稱應維持來源資料的寫法。

## Do's and Don'ts

- **Do:** 將可選能力的名稱、選取控制與效果說明留在同一可掃讀單位。
- **Do:** 使用語意化標題、段落與清單，讓規則結構不依賴空白換行。
- **Don't:** 以未連結的核取方塊和裸文字作為可選項目。
- **Don't:** 為了視覺效果隱藏表格或文件的捲動能力。
