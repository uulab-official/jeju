import 'package:dialect/screens/search/search_screen.dart';
import 'package:dialect/widgets/custom_tile.dart';
import 'package:flutter/material.dart';

class SearchItem extends StatelessWidget {
  final Item item;

  const SearchItem({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {

    return CustomTile(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(
//            builder: (context) => ProverbDetailScreen(item: item)
        ));
      },
      title: Text(
        item.name,
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
