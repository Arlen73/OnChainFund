# CSS 樣式與 ClassName 指南

本專案完全使用 **Tailwind CSS** 進行樣式設計。所有 CSS 都透過 `className` 屬性直接在 `.tsx` 檔案中應用。這種「utility-first」的方法讓我們能夠快速建構自訂設計，而無需編寫獨立的 CSS 檔案。

以下是通用樣式慣例的說明，以及應用於主要元件的 class name 的用途。

## 通用慣例

- **佈局 (Layout)**: 大多數頁面佈局是使用 Flexbox (`flex`, `justify-between`, `items-center`) 和 Grid (`grid`, `grid-cols-*`, `gap-*`) 建立的。
- **間距 (Spacing)**: 大量使用 Padding (`p-`, `px-`, `py-`) 和 Margin (`m-`, `mx-`, `my-`, `mt-`)。`space-y-*` 和 `space-x-*` 用於設定子元素之間的間距。
- **尺寸 (Sizing)**: 使用 Width (`w-*`) 和 Height (`h-*`) 設定元素尺寸。響應式前綴 (`md:`, `lg:`) 用於適應不同螢幕尺寸的佈局。
- **排版 (Typography)**: 直接應用文字大小 (`text-xs`, `text-sm`, `text-lg`, `text-xl` 等)、字重 (`font-light`, `font-medium`, `font-semibold`, `font-bold`) 和顏色 (`text-gray-*`, `text-blue-*` 等)。
- **邊框與陰影 (Borders & Shadows)**: 使用 `border`, `border-*`, `rounded-*`, 和 `shadow-*` 來設計元素容器的樣式。
- **顏色 (Colors)**: 調色盤基於 Tailwind 的預設顏色，主要使用 `gray`, `blue`, `emerald`, `red`, 和 `amber`。
- **互動性 (Interactivity)**: 使用 `hover:*`, `focus:*`, 和 `disabled:*` 前綴來設計元素在不同狀態下的樣式。
- **過渡 (Transitions)**: 使用 `transition`, `duration-*`, 和 `ease-*` 於互動元素上實現平滑的過渡效果。

## 特定元件的 Class Name

### 主要佈局與卡片

-   `container mx-auto`: 建立一個置中、固定寬度的容器，能適應螢幕大小。
-   `bg-white p-8 rounded-2xl shadow-lg`: 主要內容卡片的標準樣式。它具有白色背景、寬裕的內邊距、大的圓角和顯著的陰影。
-   `bg-gray-50`: 用於次要面板或卡片內區塊的常見背景色，以創造視覺上的區別。

### 按鈕

-   `bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700`: 主要操作按鈕 (例如「儲存」、「提交」)。
-   `bg-emerald-500 text-white ...`: 成功或正面操作按鈕 (例如「申購」、「下一步」)。
-   `bg-red-500 text-white ...`: 具破壞性或負面操作按鈕 (例如「贖回」)。
-   `bg-gray-200 text-gray-700 ...`: 次要或中性操作按鈕 (例如「上一步」)。
-   `disabled:bg-gray-400 disabled:cursor-not-allowed`: 禁用按鈕的標準樣式，使其在視覺上不可互動。

### 表單與輸入框

-   `block text-sm font-medium text-gray-700 mb-1`: 表單欄位 `<label>` 的標準樣式。
-   `w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ...`: 文字輸入框和下拉選單的基本樣式。包括全寬、內邊距、邊框、圓角和用於無障礙的焦點環。
-   `focus:ring-emerald-300 focus:border-emerald-300`: 用於「創建基金」流程中的焦點樣式，提供綠色高亮效果。
-   `p-4 border rounded-lg bg-gray-50`: 用於將相關表單元素分組的容器，例如可切換的費用設定。

### 導覽與標籤頁

-   `sticky top-0 z-50`: 用於主 `<header>`，使其在滾動時固定在視窗頂部。
-   `text-blue-600 font-semibold border-b-2 border-blue-600`: 當前有效 `NavLink` 或標籤頁的樣式，表示使用者目前的位置。
-   `text-gray-500 hover:text-blue-500`: 非當前 `NavLink` 或標籤頁的樣式。

### 表格

-   `w-full text-left`: 基本表格樣式。
-   `overflow-x-auto`: 包裹容器的 class，使表格在小螢幕上可水平滾動，以防止佈局破壞。
-   `border-b border-gray-100 hover:bg-gray-50`: 應用於 `<tr>` 元素，以建立行分隔線和懸停效果，提高可讀性。
-   `py-3 px-4 font-semibold text-sm text-gray-600`: 表格標頭 (`<th>`) 樣式。
-   `py-4 px-4`: 表格單元格 (`<td>`) 的標準內邊距。

### 徽章與指示器

-   `bg-emerald-100 text-emerald-700`: 淺綠色徽章，用於正面類型，如「申購」。
-   `bg-red-100 text-red-700`: 淺紅色徽章，用於負面類型，如「贖回」。
-   `bg-amber-100 border-l-4 border-amber-500 text-amber-700`: 顯著的警告或資訊框，用於重要通知，如半永久性設定的冷卻期。

### 特定元件

-   **Switch 開關**:
    -   `relative inline-block ...`: 主容器。
    -   `absolute ... rounded-3xl ...`: 開關的背景軌道。
    -   `... bg-emerald-500`: `checked` 狀態下的軌道顏色。
    -   `... bg-gray-300`: 非 `checked` 狀態下的軌道顏色。
    -   `absolute ... bg-white rounded-full ...`: 滑動的圓鈕。
    -   `transform translate-x-[20px]`: 在 `checked` 狀態下將圓鈕向右移動。
-   **步驟指示器 (`CreateFundPage`)**:
    -   `absolute left-4 ... w-0.5 h-[...] bg-gray-200`: 連接步驟圓圈的垂直線。
    -   `bg-blue-500 text-white`: 已完成步驟圓圈的樣式。
    -   `bg-emerald-500 text-white`: 目前步驟圓圈的樣式。
    -   `bg-gray-200 text-gray-600`: 未完成步驟圓圈的樣式。