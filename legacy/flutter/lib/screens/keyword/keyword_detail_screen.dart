import 'package:dialect/models/keyword.dart';
import 'package:flutter/material.dart';

class KeywordDetailScreen extends StatelessWidget {
  final Kitem item;

  const KeywordDetailScreen({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    String name = item.name.replaceAll('n', ' ');
    return Scaffold(
      appBar: AppBar(
        title: Text(
          name.replaceAll('n', ''),
          style: TextStyle(color: Colors.black54),
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
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Text(
                      item.contents.replaceAll('n', ' ').replaceAll('\\', ''),
                      style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                    Container(
                      margin: EdgeInsets.symmetric(vertical: 15),
                    ),
                    Text(
                      "분류",
                      style: TextStyle(
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Text(
                      item.type,
                      style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                    Container(
                      margin: EdgeInsets.symmetric(vertical: 15),
                    ),
                    Text(
                      "관련서적",
                      style: TextStyle(
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.book,
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        Row(
                          children: [
                            Text(
                              item.writer,
                              style:
                                  TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                            Text(
                              '  p.',
                              style:
                                  TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                            Text(
                              item.page,
                              style:
                                  TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      margin: EdgeInsets.symmetric(vertical: 15),
                    ),
                    Text(
                      "관련어",
                      style: TextStyle(
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Row(
                      children: [
                        Text(
                          item.index1.replaceAll('n', ' ').replaceAll('\\', ''),
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        Text(
                          ', ',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        Text(
                          item.index2.replaceAll('n', ' ').replaceAll('\\', ''),
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        Text(
                          ', ',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        Text(
                          item.index3.replaceAll('n', ' ').replaceAll('\\', ''),
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                      ],
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
