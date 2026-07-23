import 'package:dialect/models/notation.dart';
import 'package:flutter/cupertino.dart';
import 'package:logger/logger.dart';
import 'dart:convert' as convert;

class NotationProvider {
  final Logger _logger = Logger();

  NotationProvider() {
    _logger.d("NotationProvider init");
  }

  // 표기법 json load
  Future<Notation> requestNotation(BuildContext context) async {
    _logger.d("NotationProvider requestNotation");

    try {
      String jsonString = await DefaultAssetBundle.of(context).loadString("assets/data/notation.json");
      var json = convert.jsonDecode(jsonString);
      var notation = Notation.fromJson(json);
      return notation;
    } catch(e) {
      _logger.d(e.toString());
      return null;
    }
  }
}