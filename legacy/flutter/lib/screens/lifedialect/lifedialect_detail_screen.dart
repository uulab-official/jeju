import 'package:dialect/constants/strings.dart';
import 'package:dialect/models/life_dialect.dart';
import 'package:flutter/material.dart';

class LifeDialectDetailScreen extends StatelessWidget {
  final Litem item;

  const LifeDialectDetailScreen({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: Text(
          item.name.replaceAll('n', ' '),
          style: TextStyle(
              color: Colors.black54
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
              Container(
                child: Hero(
                  tag: item.image1Url,
                  child: Image.network("$baseUrl${item.image1Url}")
                ),
              ),
              SizedBox(height: 30,),
              Container(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
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
                      style: TextStyle(
                        fontSize: 18,
                        color: Colors.grey
                      ),
                    ),

                    SizedBox(height: 30,),
                    Text(
                      "제주방언",
                      style: TextStyle(
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Text(
                      item.contents.replaceAll('n', ' '),
                      style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey
                      ),
                    ),

                    SizedBox(height: 30,),
                    Text(
                      "고어",
                      style: TextStyle(
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Text(
                      item.original.replaceAll('n', ' '),
                      style: TextStyle(
                          fontFamily: 'Yethan',
                          fontSize: 18,
                          color: Colors.grey
                      ),
                    ),

                    SizedBox(height: 30,),
                    Text(
                      "표준말",
                      style: TextStyle(
                        fontSize: 24,
                      ),
                    ),
                    SizedBox(
                      height: 8,
                    ),
                    Text(
                      item.solution.replaceAll('n', ' '),
                      style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey
                      ),
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
