#!/usr/bin/env bash
read -p "Please enter store password:" storePassword && read -p "Please enter key password:" password

echo "Remember to allow USB debugging and to select PTP on the phone when USB cable is connected"

PS3='Build Please enter your choice: '
options=("Only build" "Only extract and install bundle to device" "Build, extract and install to device" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Only build")
            echo "$opt"
            cordova build android --release -- --storePassword=$storePassword --password=$password
            ;;
        "Only extract and install bundle to device")
            echo "$opt"
            rm app.apks
            java -jar ~/Android/BundleTool/bundletool-all-1.8.2.jar build-apks --bundle=/home/henla464/Documents/WiRoc/WiRoc-Config-PG/platforms/android/app/build/outputs/bundle/release/app-release.aab --output=app.apks --ks=../WiRoc.jks --ks-key-alias=WiRocConfig --ks-pass=pass:$storePassword --key-pass=pass:$password
            java -jar ~/Android/BundleTool/bundletool-all-1.8.2.jar install-apks --adb=/home/henla464/Android/Sdk/platform-tools/adb --apks=app.apks
            ;;
        "Build, extract and install to device")
            echo "$opt"
            cordova build android --release -- --storePassword=$storePassword --password=$password
            rm app.apks
            java -jar ~/Android/BundleTool/bundletool-all-1.8.2.jar build-apks --bundle=/home/henla464/Documents/WiRoc/WiRoc-Config-PG/platforms/android/app/build/outputs/bundle/release/app-release.aab --output=app.apks --ks=../WiRoc.jks --ks-key-alias=WiRocConfig --ks-pass=pass:$storePassword --key-pass=pass:$password
            java -jar ~/Android/BundleTool/bundletool-all-1.8.2.jar install-apks --adb=/home/henla464/Android/Sdk/platform-tools/adb --apks=app.apks
            ;;
        "Quit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done


