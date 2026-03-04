import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

void showAppToast(
  String message, {
  ToastGravity gravity = ToastGravity.BOTTOM,
}) {
  if (message.trim().isEmpty) return;

  Fluttertoast.cancel();

  Fluttertoast.showToast(
    msg: message.trim(),
    toastLength: Toast.LENGTH_SHORT,
    gravity: gravity,
    backgroundColor: Colors.black.withOpacity(0.85),
    textColor: Colors.white,
    fontSize: 14,
  );
}

