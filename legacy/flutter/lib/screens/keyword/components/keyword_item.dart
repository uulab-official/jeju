import 'package:dialect/models/keyword.dart';
import 'package:dialect/widgets/custom_tile.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../keyword_detail_screen.dart';

class KeywordItem extends StatelessWidget {
  final Kitem item;

  const KeywordItem({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    String name = item.name.replaceAll('n', ' ');

    return CustomTile(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(
          builder: (context) => KeywordDetailScreen(item: item)
        ));
      },
      title: Text(
        name.replaceAll('\\', ''),
        style: TextStyle(
          fontSize: 16,
        ),
      ),
      trailing: Row(
        children: <Widget>[
          Icon(
            Icons.keyboard_arrow_right,
          ),
        ],
      ),
    );
  }
}
