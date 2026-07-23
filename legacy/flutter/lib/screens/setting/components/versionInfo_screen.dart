import 'package:flutter/material.dart';

class VersionInfoScreen extends StatelessWidget {

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          '버전 정보',
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
            Row(
              children: [
                Text(
                  '버전: ',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Colors.black54
                  ),
                ),
                Text(
                  '1.0.0+1',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Colors.black54
                  ),
                ),
              ],
            ),
            Row(
              children: [
                Text(
                  '업데이트 일자: ',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Colors.black54
                  ),
                ),
                Text(
                  '2021.03.24',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Colors.black54
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
