import 'package:dialect/constants/strings.dart';
import 'package:dialect/models/keyword.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:xml2json/xml2json.dart';
import 'dart:convert' as convert;

class KeywordProvider with ChangeNotifier {
  final Logger _logger = Logger();
  var netWorkSuccess = false;

  Keyword _keyword;
  Keyword get keyword => _keyword;

  //
  KeywordProvider() {
    _logger.d("KeywordProvider init");
  }

  void setData(Keyword keyword) {
    _logger.d("KeywordProvider setData");

    _keyword = keyword;
    notifyListeners();
  }

  Future<bool> requestKeywords() async {
    _logger.d("KeywordProvider requestKeywords");
    netWorkSuccess = false;

    try {
      var queryParam = {
        "pageSize" : "999999999",
      };
      var uri = Uri.https(authority, keywordPath, queryParam);
      final response = await http.get(uri);

//      final response = await http.get(keywordUrl);
      if (response.statusCode == 200) {

        final body = response.body;
        final Xml2Json _parser = Xml2Json()..parse(body);
        final jsonString = _parser.toParker();
        var newString = jsonString.replaceAllMapped(RegExp(r'\&#[0-9]*;'), (Match m) {
          var value = m[0].replaceAll(RegExp(r'\D'), '');

          return String.fromCharCode(int.parse(value));
        });
        final json = convert.jsonDecode(newString);
        final keyword = Keyword.fromJson(json);
        setData(keyword);

        netWorkSuccess = true;

        return true;
      }
      return false;

    } catch(e) {
      _logger.d(e.toString());
      return false;
    }
  }
}