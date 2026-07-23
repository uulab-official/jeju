import 'package:dialect/screens/home/home_screen.dart';
import 'package:dialect/screens/notation/notation_screen.dart';
import 'package:dialect/screens/setting/setting_screen.dart';
import 'package:flutter/material.dart';

class TabScreen extends StatefulWidget {
  @override
  _TabScreenState createState() => _TabScreenState();
}
class _TabScreenState extends State<TabScreen> {
  PageController _pageController;
  int _currentIndex;
  @override
  void initState() {
    super.initState();
    _currentIndex = 0;
    _pageController = PageController();
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      //키패드 공간 차지 무시
      resizeToAvoidBottomInset: false,
//      resizeToAvoidBottomPadding: false,
      body: PageView(
        physics: NeverScrollableScrollPhysics(), //pageView disable swipe
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        children: <Widget>[
          HomeScreen(),
          NotationScreen(),
          SettingScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          _pageController.jumpToPage(index);
        },
        selectedItemColor: Colors.deepOrange,
        unselectedItemColor: Colors.grey.shade400,
        selectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontWeight: FontWeight.w600,
        ),
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(
            icon: Icon(
              Icons.home,
            ),
            label: "홈",
          ),
          BottomNavigationBarItem(
            icon: Icon(
              Icons.translate,
            ),
            label: "표기법",
          ),
          BottomNavigationBarItem(
            icon: Icon(
              Icons.settings,
            ),
            label: "설정",
          ),
        ],
      ),
    );
  }
  @override
  void dispose() {
    super.dispose();
  }
}