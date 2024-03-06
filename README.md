# Answer the Ovice

Answer the Oviceは、oviceのマイクのミュート・ミュート解除を簡単に切り替えることができるChrome拡張機能です。
oviceのタブに切り替えなくても、呼びかけに応じることができます。

## 動作環境

* Google Chrome
* Microsoft Edge
* Opera
* Brave
* Arc
* 他、Chromium 派生のブラウザ

## インストール方法

1. [Releases](https://github.com/mypicto/answer-the-ovice/releases/latest) から最新版のZIPファイルをダウンロードし、ローカルに保存します。  
  ZIPをダウンロードした場合は、解凍して任意のフォルダに配置してください。  
  このフォルダは拡張機能を使用しなくなるかアンインストールするまで移動や削除をしないでください。  
  （移動した場合は拡張機能の再インストールが必要です）
1. Chromeで拡張機能を管理(`chrome://extensions/`) にアクセスします。
1. 右上の「デベロッパーモード」を有効にします。
1. 「パッケージ化されていない拡張機能を読み込む」をクリックし、先ほど保存した拡張機能のディレクトリ内の `extension` フォルダを選択します。

### 初期設定

1. 拡張機能のアイコンをクリックし、「設定」を開きます。
1. 「スペースURL」に、oviceのURLを入力します。  
1. 保存ボタンを押して設定を保存します。
1. ovice の 個人設定 > プロフィール から 「コントロールツールバーを常時表示」 をオンにします。  

## 使い方

1. oviceのタブを開くと、拡張機能のアイコンが有効になります。
1. 拡張機能のアイコンをクリックすることで、マイクのミュート・ミュート解除の切り替えができます。

### アイコンの色

| 色 | 説明 |
| ---- | ------ |
| ![赤色](https://github.com/mypicto/answer-the-ovice/blob/main/extension/image/icon_off.png) | ミュート状態です。 |
| ![緑色](https://github.com/mypicto/answer-the-ovice/blob/main/extension/image/icon_on.png) | マイク有効状態です。 |
| ![灰色](https://github.com/mypicto/answer-the-ovice/blob/main/extension/image/icon_disable.png) | oviceのタブが開かれていない。<br>またはスペースドメインが適切に設定されておらず、oviceのタブが見つからない。 |

### ショートカットキー

Chromeの 拡張機能を管理 > キーボードショートカット からショートカットキーを有効にすることで、キーボード操作でマイクを簡単に切り替えることができます。  
また、その際に 「Chrome 専用」を「グローバル」へと切り替える事で、ブラウザ以外で作業中にも操作可能にできます。

| コマンド | 説明 |
| ---- | ------ |
| マイク オン/オフ | ovice のマイク オン/オフ を交互に切り替えます。 |
| マイク オン/オフ して、タブをアクティブにする | ovice のマイク オン/オフ を交互に切り替えてから、ovice タブへ移動します。 |


## トラブルシューティング

### アイコンの色がずっと灰色のまま

設定したスペースドメインのoviceを開いているにもかかわらず、アイコンの色が灰色から変化しない場合、oviceのWebサイトデザイン変更によりマイクボタンのxPathが変化している可能性があります。

1. ovice Webサイト内の任意の場所を右クリック
2. コンテキストメニューから "検証" を選択
3. ウィンドウ右側に表示されたビューの左上、点線の矩形を矢印が指しているアイコンを選択
4. アイコンが青くなっている状態で ovice のマイクボタンをクリック
5. 右側のビューでマイクボタンのHTMLタグが選択状態になる
6. そのタグが `<button>` タグである事を確認したらタグを右クリック
7. コンテキストメニューから "Copy > Copy XPath" を選択
8. Answer the Ovice のオプション画面から "マイクボタンの xPath" に貼り付けて保存
