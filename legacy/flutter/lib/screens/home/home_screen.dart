import 'package:dialect/providers/dictionary_provider.dart';
import 'package:dialect/screens/dictionary/dictionary_screen.dart';
import 'package:dialect/screens/keyword/keyword_screen.dart';
import 'package:dialect/screens/lifedialect/lifedialect_screen.dart';
import 'package:dialect/screens/proverb/proverb_screen.dart';
import 'package:dialect/widgets/category_card.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {

  DictionaryProvider dictionaryProvider;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Color(0xffffc266),
      ),
      child: Column(

        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Stack(
            children: [
              Container(
                width: double.infinity,
                margin: EdgeInsets.only(top: 54),
                padding: EdgeInsets.only(left: 20),
                child: Text(
                  '제줏 말싸미',
                  style: TextStyle(
                    fontFamily: 'Yethan',
                    fontSize: 35,
                    fontWeight: FontWeight.w900,
                    color: Colors.black54
                  ),
                ),
              ),
              Container(
                height: 42,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.deepOrange,
                  borderRadius: BorderRadius.circular(13),
                ),
                margin: EdgeInsets.only(top: 120, left: 20, right: 40),
                padding: EdgeInsets.only(left: 48, right: 16, top: 16, bottom: 16),
              ),
              Container(
                height: 42,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.deepOrangeAccent,
                  borderRadius: BorderRadius.circular(13),
                ),
                margin: EdgeInsets.only(top: 140, left: 40, right: 20),
                padding: EdgeInsets.only(left: 48, right: 16, top: 16, bottom: 16),
              ),
            ],
          ),
          Container(
            padding: EdgeInsets.only(left: 20, right: 20, bottom: 20),
            child: GridView.count(
              physics: NeverScrollableScrollPhysics(),
              shrinkWrap: true,
              crossAxisCount: 2,
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
              children: <Widget>[
                CategoryCard(
                  title: "제주 생활 방언",
                  svgSrc: "assets/icons/dialect.svg",
                  press: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                          builder: (context) => LifeDialectScreen()),
                    );
                  },
                ),
                CategoryCard(
                  title: "제주 속담",
                  svgSrc: "assets/icons/proverb.svg",
                  press: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                          builder: (context) => ProverbScreen()),
                    );
                  },
                ),
                CategoryCard(
                  title: "제주 사전",
                  svgSrc: "assets/icons/book.svg",
                  press: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                          builder: (context) => DictionaryScreen()),
                    );
                  },
                ),
                CategoryCard(
                  title: "색인어 사전",
                  svgSrc: "assets/icons/keyword.svg",
                  press: () {
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                          builder: (context) => KeywordScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
