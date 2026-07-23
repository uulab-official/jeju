import 'package:dialect/constants/strings.dart';
import 'package:dialect/models/dictionary.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:xml2json/xml2json.dart';
import 'dart:convert' as convert;

class DictionaryProvider with ChangeNotifier {
  final Logger _logger = Logger();
  var netWorkSuccess = false;

  Dictionary _dictionary;
  Dictionary get dictionary => _dictionary;

  DictionaryProvider() {
    _logger.d("DictionaryProvider init");
  }

  void setData(Dictionary dictionary) {
    _logger.d("DictionaryProvider setData");

    _dictionary = dictionary;
    notifyListeners();
  }

  Future<bool> requestDictionaries() async {
    _logger.d("DictionaryProvider requestDictionaries");
    netWorkSuccess = false;
    try {

      var queryParam = {
        "pageSize" : "999999999",
      };
      var uri = Uri.https(authority, dictionaryPath, queryParam);
      final response = await http.get(uri);
//      final response = await http.get(dictionaryUrl);

      if (response.statusCode == 200) {
        final body = response.body;
        final Xml2Json _parser = Xml2Json()..parse(body);
        final jsonString = _parser.toParker().replaceAll('\\\\\\', '').replaceAll('\\\"', '').replaceAll('\\', '');
        var newString = jsonString.replaceAllMapped(RegExp(r'&#[0-9]*;'), (Match m) {
          var value = m[0].replaceAll(RegExp(r'\D'), '');
          return String.fromCharCode(int.parse(value));
        });
        final json = convert.jsonDecode(newString);
        final dictionary = Dictionary.fromJson(json);
        setData(dictionary);

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