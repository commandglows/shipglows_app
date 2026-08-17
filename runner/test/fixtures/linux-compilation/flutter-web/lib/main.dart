import 'package:flutter/material.dart';

void main() => runApp(const ShipGlowsFixture());

class ShipGlowsFixture extends StatelessWidget {
  const ShipGlowsFixture({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: Scaffold(
        body: Center(child: Text('Flutter Web fixture')),
      ),
    );
  }
}
