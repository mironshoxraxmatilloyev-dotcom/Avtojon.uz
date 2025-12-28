package uz.avtojon.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Status bar ni normal qilish - overlay emas
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        
        // Status bar rangini o'rnatish
        getWindow().setStatusBarColor(getResources().getColor(R.color.colorPrimaryDark, getTheme()));
    }
}
