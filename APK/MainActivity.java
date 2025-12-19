package com.example.accessibilityapp;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    
    private static final int REQUEST_ACCESSIBILITY = 1;
    private List<AppInfo> appList = new ArrayList<>();
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Check and request accessibility permission
        checkAndRequestAccessibility();
        
        // Load the list of installed apps
        loadApps();
    }
    
    private void loadApps() {
        PackageManager pm = getPackageManager();
        List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        
        appList.clear();
        
        for (ApplicationInfo packageInfo : packages) {
            if (pm.getLaunchIntentForPackage(packageInfo.packageName) != null) {
                // Only add apps that can be launched
                appList.add(new AppInfo(
                    packageInfo.loadLabel(pm).toString(),
                    packageInfo.packageName,
                    packageInfo.loadIcon(pm)
                ));
            }
        }
        
        // Sort alphabetically
        Collections.sort(appList, (o1, o2) -> o1.name.compareToIgnoreCase(o2.name));
        
        // Connect to ListView
        ListView listView = findViewById(R.id.app_list);
        ArrayAdapter<AppInfo> adapter = new ArrayAdapter<>(
            this, 
            android.R.layout.simple_list_item_1,
            appList
        );
        
        listView.setAdapter(adapter);
        
        // Launch app when clicked
        listView.setOnItemClickListener((parent, view, position, id) -> {
            AppInfo app = appList.get(position);
            openApp(app.packageName);
        });
    }
    
    private void openApp(String packageName) {
        try {
            Intent intent = getPackageManager().getLaunchIntentForPackage(packageName);
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } else {
                Toast.makeText(this, "Could not launch the app", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    private void checkAndRequestAccessibility() {
        if (!isAccessibilityServiceEnabled()) {
            // Open accessibility settings
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            startActivityForResult(intent, REQUEST_ACCESSIBILITY);
            
            // Show instruction
            Toast.makeText(this, "Please enable our app in accessibility services", Toast.LENGTH_LONG).show();
        }
    }
    
    private boolean isAccessibilityServiceEnabled() {
        String prefString = Settings.Secure.getString(
            getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        
        return prefString != null && prefString.contains(getPackageName());
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_ACCESSIBILITY) {
            if (isAccessibilityServiceEnabled()) {
                Toast.makeText(this, "Accessibility service enabled successfully!", Toast.LENGTH_SHORT).show();
            }
        }
    }
    
    // Helper class for app information
    private static class AppInfo {
        String name;
        String packageName;
        android.graphics.drawable.Drawable icon;
        
        AppInfo(String name, String packageName, android.graphics.drawable.Drawable icon) {
            this.name = name;
            this.packageName = packageName;
            this.icon = icon;
        }
        
        @Override
        public String toString() {
            return name;
        }
    }
}
