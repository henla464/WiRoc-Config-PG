#!/usr/bin/env bash

read -p "Please enter store password:" storePassword && read -p "Please enter key password:" password && cordova build android --release -- --storePassword=$storePassword --password=$password
