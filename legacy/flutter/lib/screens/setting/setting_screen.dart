import 'package:dialect/screens/setting/components/appInfo_screen.dart';
import 'package:dialect/screens/setting/components/language_setting.dart';
import 'package:dialect/screens/setting/components/setting_item.dart';
import 'package:flutter/material.dart';

import 'components/versionInfo_screen.dart';

class SettingScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {

    return Scaffold(
      resizeToAvoidBottomInset: false,
//      resizeToAvoidBottomPadding: false,
      appBar: AppBar(
        elevation: 0,
        title: Text(
          '설정',
          style: TextStyle(
            color: Colors.black87,
          ),
        ),
        backgroundColor: Color(0xffffc266),
      ),
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Color(0xffffc266),
        ),
        child: Column(
//          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Container(
              width: double.infinity,
              margin: EdgeInsets.only(left: 16, right: 16, top: 50),
              padding: EdgeInsets.only(top: 16, right: 8, left: 8, bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '   앱정보',
                    style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w500,
                        color: Colors.black87),
                  ),
                  SizedBox(
                    height: 16,
                  ),
//                  SettingItem(
//                    icon: Icons.language,
//                    text: '언어',
//                    onTab: (){
//                      Navigator.push(context, MaterialPageRoute(
//                          builder: (context) => LanguageSetting()
//                      ));
//                    },
//                  ),
                  SettingItem(
                    icon: Icons.info_outline,
                    text: '버전정보',
                    onTab: (){
                      Navigator.push(context, MaterialPageRoute(
                          builder: (context) => VersionInfoScreen()
                      ));
                    },
                  ),
                  SettingItem(
                    icon: Icons.perm_device_information,
                    text: '앱 정보',
                    onTab: (){
                      Navigator.push(context, MaterialPageRoute(
                          builder: (context) => AppInfoScreen()
                      ));
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
