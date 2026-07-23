import 'package:dialect/models/dictionary.dart';
import 'package:flutter/material.dart';

class DictionaryDetailScreen extends StatelessWidget {
  final Ditem item;

  const DictionaryDetailScreen({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    String name = item.name.replaceAll('\n', '');

    return Scaffold(
      appBar: AppBar(
        title: Text(
            item.name.replaceAll('n', ' '),
          style: TextStyle(
              fontFamily: 'Yethan',
              color: Colors.black54,
              fontWeight: FontWeight.w600
          ),
        ),
        backgroundColor: Color(0xffffc266),
      ),
      body: SingleChildScrollView(
        physics: BouncingScrollPhysics(),
        child: Container(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
            SizedBox(
            height: 8,
          ),
          Container(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  "설명",
                  style: TextStyle(
                    fontSize: 20,
                  ),
                ),
                SizedBox(
                  height: 8,
                ),
                Text(
                  item.contents.replaceAll('n', ' '),
                  style: TextStyle(
                      fontFamily: 'Yethan',
                      fontSize: 18,
                      color: Colors.grey),
                ),
                Container(
                  margin: EdgeInsets.symmetric(vertical: 15),
                ),
                Text(
                  "분류",
                  style: TextStyle(
                    fontSize: 20,
                  ),
                ),
                SizedBox(
                  height: 8,
                ),
                Text(
                  item.index.replaceAll('n', ' '),
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
                Container(
                  margin: EdgeInsets.symmetric(vertical: 15),
                ),
                Text(
                  'English',
                  style: TextStyle(fontSize: 20,),
                ),
                SizedBox(
                  height: 8,
                ),
                Text(
                  item.engContents,
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
                SizedBox(
                  height: 30,
                ),
                Text(
                  '中文',
                  style: TextStyle(fontSize: 20,),
                ),
                SizedBox(
                  height: 8,
                ),
                Text(
                  item.chiContents.replaceAll('n', ' '),
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
                SizedBox(
                  height: 30,
                ),
                Text(
                  '日本',
                  style: TextStyle(fontSize: 20,),
                ),
                SizedBox(
                  height: 8,
                ),
                Text(
                  item.janContents.replaceAll('n', ' '),
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
              ],
            ),
          ),
          ],
      ),
    ),
      ),
    );
  }
}
