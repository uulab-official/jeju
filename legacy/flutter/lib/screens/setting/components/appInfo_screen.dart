import 'package:flutter/material.dart';

class AppInfoScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          '앱 정보',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black54,
          ),
        ),
        elevation: 0,
        backgroundColor: Color(0xffffc266),
      ),
      backgroundColor: Color(0xffffc266),
      body: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(13),
        ),
        margin: EdgeInsets.all(20),
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '앱 소개',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(
              height: 16,
            ),
            Text(
              '제주도의 생활방언과 속담, 색인어등 제주도 말과 관련된 정보를 사용자에게 제공해주는 앱입니다.',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black54),
            ),
            SizedBox(
              height: 8,
            ),
            Text(
              '사용자는 해당 앱을 통해 제주도 말의 관련된 여러 정보를 습득할 수 있고 다양한 분야에서 활용할 수 있을 것입니다.',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black54),
            ),
            SizedBox(
              height: 16,
            ),

          ],
        ),
      ),
    );
  }
}
