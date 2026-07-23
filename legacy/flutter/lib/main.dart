import 'package:dialect/providers/dictionary_provider.dart';
import 'package:dialect/providers/keyword_provider.dart';
import 'package:dialect/providers/lifedialect_provider.dart';
import 'package:dialect/providers/proverb_provider.dart';
import 'package:dialect/widgets/tab_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Device Portrait
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (context) => LifeDialectProvider(),
        ),
        ChangeNotifierProvider(
          create: (context) => ProverbProvider(),
        ),
        ChangeNotifierProvider(
          create: (context) => DictionaryProvider(),
        ),
        ChangeNotifierProvider(
          create: (context) => KeywordProvider(),
        )
      ],
      child: MaterialApp(
        title: 'Flutter Demo',
        theme: ThemeData(
          primarySwatch: Colors.orange,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: TabScreen(),
      ),
    );
  }
}