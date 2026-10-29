# 片場：戰爭片拍攝中（全班連線版）

課堂手機遊戲：學生是四個劇組的演員，在同一條虛構城鎮的街道上拍同一場戰鬥戲（第一人稱射擊，手機橫向）。老師的電腦是導演大螢幕：選劇本、喊開拍、看全景與票房、最後放「首映」翻牌。主題：軍事娛樂複合體。

- 老師（電腦，接投影機）：https://op06dhans-eng.github.io/Gun-movie/
- 學生（掃老師畫面上的 QR Code，進課堂遊戲大廳）：https://op06dhans-eng.github.io/Gun-movie/go.html
- 學生直接進遊戲：https://op06dhans-eng.github.io/Gun-movie/play.html
- 同一台電腦練習連線（開兩個分頁，一個老師一個學生）：https://op06dhans-eng.github.io/Gun-movie/preview.html
- 假學生連線預演：https://op06dhans-eng.github.io/Gun-movie/bots.html

## 兩種劇本
- **軍方支援版**：M4 卡賓槍、無人機偵察（看得到敵人位置）、一次空襲，票房 ×2；但有審片規則：不准打到平民臨演、不准損毀贊助方旗幟海報、不准後退出鏡。違規一次，軍方當場撤回裝備（換成道具槍、沒有偵察與空襲）。
- **獨立製片版**：沒有規則，也沒有軍方裝備（道具槍）；街上有市集、很多平民。

建議上課流程：先拍一條軍方支援版 → 首映翻牌 → 再拍一條獨立製片版 → 首映時兩版對照。

## 素材出處
- 人物：[Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox)（MIT），由 [mini-cry](https://github.com/vvanghelue/mini-cry) 轉成 glTF（迷彩重新上色、徽章塗掉）。
- 動作：Quaternius Universal Animation Library（CC0），以 mini-cry 的重定向程式（ISC）離線烘焙到上述人體骨架。
- 第一人稱手臂：Rocketbox Military_Male_03（MIT）；手臂 IK 程式移植自 mini-cry（ISC）。
- 步槍：M4A1 by [TORI106](https://sketchfab.com/3d-models/m4a1-33107f38b23c45cc8103768c0e961cdf)（CC-BY 4.0）；AKM by LonesomeDucky（OpenGameArt，CC0）。
- 裝甲車：[BTR 80 by Goga.Danelia](https://sketchfab.com/3d-models/2980ab7cbc4d41b7893e3233e9dcc1ce)（CC-BY 4.0）。休旅車：[Mercedes-Benz G-Class 2021 by ItsDiyor](https://sketchfab.com/3d-models/1768618c049b49fcb0d09a86d6f67c8d)（CC-BY 4.0）。兩者經 [offroad](https://github.com/Arz-Gev/offroad) 壓縮，本專案再縮小貼圖與面數。
- 槍口火光：真實照片去背（offroad 專案製作）：Muzzle flash VFX 1–5 by ZunterPHOTO（Wikimedia Commons，CC0）、"Light 'Em Up" 美國海軍陸戰隊（公共領域）。
- 材質：[ambientCG](https://ambientcg.com)（CC0，經 null3d sample-assets 整理）、[Poly Haven](https://polyhaven.com)（CC0）。天空：Poly Haven kloofendal_48d_partly_cloudy_puresky（CC0）。
- 槍聲：Freesound（CC0）：ninebilly（AK 連發）、michorvath（AR15、9mm、霰彈槍）、hyperix6（Colt SMG 換彈）、jackthemurray（AR15 槍機）、brianhanson2nd（空槍）；跳彈音效取自 Pixabay。
- QR Code：Kazuhiko Arase 的 qrcode.js（MIT）。

本遊戲中的國家（北境共和國）、軍隊、電影與人物皆為虛構。
